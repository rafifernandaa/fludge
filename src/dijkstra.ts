import { MusterPoint, RoadNode, RoadEdge, EvacuationRoute, RiverSensor } from './types';
import { MUSTER_POINTS, ROAD_NODES, ROAD_EDGES, SHELTER_CONNECTORS } from './routing_data';

/**
 * Calculates spherical distance in kilometers using the Haversine formula
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Dynamic flood-aware cost function for an edge segment.
 * If the road passes near a river sensor experiencing severe overflow,
 * the path cost increases significantly to force detours around flooded pathways.
 */
export function getEdgeCost(
  fromNode: { lat: number; lon: number },
  toNode: { lat: number; lon: number },
  baseDistanceKm: number,
  sensors: RiverSensor[]
): { cost: number; averageHazard: number } {
  // Midpoint of the road segment
  const midLat = (fromNode.lat + toNode.lat) / 2;
  const midLon = (fromNode.lon + toNode.lon) / 2;

  // Find the nearest river sensor
  let nearestSensor: RiverSensor | null = null;
  let minDist = Infinity;

  for (const s of sensors) {
    const dist = getDistanceKm(midLat, midLon, s.lat, s.lon);
    if (dist < minDist) {
      minDist = dist;
      nearestSensor = s;
    }
  }

  let penaltyMultiplier = 1.0;
  let averageHazard = 0; // 0 to 1

  // If a river sensor is within 2.2 kilometers of the road segment
  if (nearestSensor && minDist < 2.2) {
    const proximityWeight = Math.max(0, 1 - minDist / 2.2); // 1.0 at 0km, 0 at 2.2km
    const floodProbability = nearestSensor.exceedance_prob; // 0.0 to 1.0

    if (floodProbability > 0.20) {
      averageHazard = floodProbability * proximityWeight;
      // High hazard raises edge weight by up to 10x, triggering Dijkstra detours
      penaltyMultiplier = 1.0 + averageHazard * 9.0;
    }
  }

  return {
    cost: baseDistanceKm * penaltyMultiplier,
    averageHazard
  };
}

/**
 * Executes a Dijkstra-based pathfinding query from a high-risk neighborhood RT
 * to the nearest identified muster point shelter.
 */
export function calculateEvacuationRoute(
  startLat: number,
  startLon: number,
  sensors: RiverSensor[]
): EvacuationRoute | null {
  // 1. Locate the nearest entry node on the road network
  let startNode: RoadNode | null = null;
  let minStartDist = Infinity;

  for (const node of ROAD_NODES) {
    const dist = getDistanceKm(startLat, startLon, node.lat, node.lon);
    if (dist < minStartDist) {
      minStartDist = dist;
      startNode = node;
    }
  }

  if (!startNode) return null;

  // 2. Build adjacency list of the graph
  // We include both RoadNodes and MusterPoints as graph vertices
  const graph: Record<string, { toId: string; baseDist: number; name: string }[]> = {};

  // Initialize nodes
  for (const node of ROAD_NODES) {
    graph[node.id] = [];
  }
  for (const mp of MUSTER_POINTS) {
    graph[mp.id] = [];
  }

  // Add road edges (bidirectional)
  for (const edge of ROAD_EDGES) {
    graph[edge.fromId].push({ toId: edge.toId, baseDist: edge.baseDistanceKm, name: edge.name });
    graph[edge.toId].push({ toId: edge.fromId, baseDist: edge.baseDistanceKm, name: edge.name });
  }

  // Add shelter connector edges (bidirectional)
  for (const conn of SHELTER_CONNECTORS) {
    graph[conn.shelterId].push({ toId: conn.roadNodeId, baseDist: conn.distanceKm, name: "Shelter Access Rd" });
    graph[conn.roadNodeId].push({ toId: conn.shelterId, baseDist: conn.distanceKm, name: "Shelter Access Rd" });
  }

  // Map of all graph nodes (RoadNodes + MusterPoints) to get coordinates
  const allNodesMap: Record<string, { lat: number; lon: number; name: string; id: string }> = {};
  for (const node of ROAD_NODES) {
    allNodesMap[node.id] = node;
  }
  for (const mp of MUSTER_POINTS) {
    allNodesMap[mp.id] = mp;
  }

  // 3. Dijkstra's Algorithm
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const baseDistances: Record<string, number> = {}; // Tracks actual km travelled, without hazard multiplier penalties
  const hazards: Record<string, number> = {}; // Tracks hazard scores along the path
  const unvisited = new Set<string>();

  for (const nodeId in graph) {
    distances[nodeId] = Infinity;
    baseDistances[nodeId] = Infinity;
    hazards[nodeId] = 0;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  }

  distances[startNode.id] = 0;
  baseDistances[startNode.id] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance cost
    let u: string | null = null;
    let minDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        u = nodeId;
      }
    }

    if (u === null || distances[u] === Infinity) {
      break; // No reachable nodes left
    }

    unvisited.delete(u);

    // Update distances of neighbors
    const uNode = allNodesMap[u];
    for (const neighbor of graph[u]) {
      if (!unvisited.has(neighbor.toId)) continue;

      const vNode = allNodesMap[neighbor.toId];
      const { cost, averageHazard } = getEdgeCost(uNode, vNode, neighbor.baseDist, sensors);
      const altCost = distances[u] + cost;

      if (altCost < distances[neighbor.toId]) {
        distances[neighbor.toId] = altCost;
        baseDistances[neighbor.toId] = baseDistances[u] + neighbor.baseDist;
        hazards[neighbor.toId] = Math.max(hazards[u], averageHazard);
        previous[neighbor.toId] = u;
      }
    }
  }

  // 4. Find the best Muster Point (the one with the minimum Dijkstra cost)
  let bestMusterPoint: MusterPoint | null = null;
  let minMusterCost = Infinity;

  for (const mp of MUSTER_POINTS) {
    if (distances[mp.id] < minMusterCost) {
      minMusterCost = distances[mp.id];
      bestMusterPoint = mp;
    }
  }

  if (!bestMusterPoint || distances[bestMusterPoint.id] === Infinity) {
    return null;
  }

  // 5. Reconstruct the shortest path from startNode to bestMusterPoint
  const pathNodeIds: string[] = [];
  let curr: string | null = bestMusterPoint.id;

  while (curr !== null) {
    pathNodeIds.unshift(curr);
    curr = previous[curr];
  }

  // Convert IDs back to RoadNode / MusterPoint objects (represented as RoadNode format)
  const pathNodes: RoadNode[] = pathNodeIds.map(id => {
    const node = allNodesMap[id];
    return {
      id: node.id,
      name: node.name,
      lat: node.lat,
      lon: node.lon
    };
  });

  // Calculate the path's safety score (100 is perfectly safe, 0 is heavily flooded)
  const pathHazard = hazards[bestMusterPoint.id];
  const safetyScore = Math.max(0, Math.min(100, Math.round((1.0 - pathHazard) * 100)));

  return {
    pathNodes,
    totalDistanceKm: baseDistances[bestMusterPoint.id],
    musterPoint: bestMusterPoint,
    safetyScore
  };
}
