import re

with open("src/Hud.tsx", "r") as f:
    content = f.read()

return_idx = content.find("  return (")
if return_idx == -1:
    print("Could not find return statement")
    exit(1)

before_return = content[:return_idx]

new_return = """  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors ${isDarkMode ? "dark bg-[#111111]" : "bg-stone-50"} text-stone-900 dark:text-stone-50 font-sans antialiased selection:bg-brand-cyan/30`}>
      
      {/* TOP BAR */}
      <header className="h-14 bg-white dark:bg-[#0A0A0A] border-b border-stone-200 dark:border-stone-800 flex justify-between items-center px-4 shrink-0 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="text-blue-500 flex items-center justify-center p-1 bg-blue-500/10 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-bold text-xl tracking-tight">Fludge</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <Settings size={18} />
          </button>

          <div className="bg-[#76b900] text-black font-bold text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
             </svg>
            <span>NVIDIA</span>
          </div>
          <div className="bg-white px-2 py-1.5 rounded border border-stone-200 flex items-center justify-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 2V14M24 34V46M14 24H2M46 24H34M9 9L17 17M39 39L31 31M39 9L31 17M9 39L17 31" stroke="#4285F4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="w-14 bg-white dark:bg-[#0A0A0A] border-r border-stone-200 dark:border-stone-800 flex flex-col items-center py-4 z-40 gap-4 shrink-0">
          <button onClick={() => setActiveBottomTab('map' as any)} className={`p-2.5 rounded-lg transition-colors ${activeBottomTab === 'map' || activeBottomTab === 'rankings' && false ? 'bg-blue-500/10 text-blue-500' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
            <Compass size={20} />
          </button>
          <button onClick={() => setActiveBottomTab('rankings')} className={`p-2.5 rounded-lg transition-colors ${activeBottomTab === 'rankings' ? 'bg-blue-500/10 text-blue-500' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
            <Activity size={20} />
          </button>
          <button onClick={() => setActiveBottomTab('gev_inspector')} className={`p-2.5 rounded-lg transition-colors ${activeBottomTab === 'gev_inspector' ? 'bg-blue-500/10 text-blue-500' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
            <Database size={20} />
          </button>
          <button onClick={() => setActiveBottomTab('data_pipeline')} className={`p-2.5 rounded-lg transition-colors ${activeBottomTab === 'data_pipeline' ? 'bg-blue-500/10 text-blue-500' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
            <Layers size={20} />
          </button>
          <button onClick={() => setActiveBottomTab('python_core')} className={`p-2.5 rounded-lg transition-colors ${activeBottomTab === 'python_core' ? 'bg-blue-500/10 text-blue-500' : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'}`}>
            <Terminal size={20} />
          </button>
          <div className="mt-auto flex flex-col gap-4 border-t border-stone-200 dark:border-stone-800 pt-4 w-full items-center">
            <button onClick={exportToPdf} className="p-2.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
              <Download size={20} />
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 relative bg-stone-50 dark:bg-[#111111] overflow-hidden">
          {(activeBottomTab as string) === 'map' || (activeBottomTab as string) === 'rankings' && false ? (
            <div className="absolute inset-0 w-full h-full">
               <MapCanvas
                  rts={rankedRts}
                  sensors={computedSensors}
                  stations={stations}
                  catchments={catchments}
                  selectedRtId={selectedRt?.rt_id || null}
                  selectedSensorId={selectedSensorId}
                  onSelectRt={(rtId) => {
                    const rt = rankedRts.find((r) => r.rt_id === rtId);
                    if (rt) {
                      setSelectedRt(rt);
                      setSelectedSensorId(rt.associated_sensor_id);
                    } else {
                      setSelectedRt(null);
                    }
                  }}
                  onSelectSensor={(sensorId) => {
                    setSelectedSensorId(sensorId);
                    setSelectedRt(null);
                  }}
                  activeRoute={activeRoute}
                  liveSimulation={liveSimulation}
                />
                
                {/* Floating Panels */}
                <div className="absolute top-4 right-4 w-80 space-y-4 pointer-events-none">
                  {/* Simulation Panel */}
                  <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-4 rounded-xl shadow-lg pointer-events-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Simulation Panel</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-stone-500">Risk panel</span>
                           <div className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${liveSimulation ? 'bg-green-500' : 'bg-stone-300 dark:bg-stone-700'}`} onClick={() => setLiveSimulation(!liveSimulation)}>
                              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${liveSimulation ? 'translate-x-4' : 'translate-x-0'}`}></div>
                           </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                       {SIMULATION_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setActivePresetId(preset.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            activePresetId === preset.id
                              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400"
                              : "bg-stone-50 dark:bg-[#111111] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Command Advisory */}
                  <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-5 rounded-xl shadow-lg pointer-events-auto relative">
                     {/* Speech bubble pointer */}
                     <div className="absolute top-10 -left-2 w-4 h-4 bg-white/95 dark:bg-[#1A1A1A]/95 border-l border-b border-stone-200 dark:border-stone-800 transform rotate-45"></div>
                     <div className="relative z-10">
                        <h2 className="font-bold text-2xl mb-3 leading-tight tracking-tight text-stone-900 dark:text-white">Gemini AI Command Advisory</h2>
                        {aiBriefLoading ? (
                          <div className="animate-pulse space-y-3 mt-4">
                            <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-3/4"></div>
                            <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full"></div>
                            <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-5/6"></div>
                          </div>
                        ) : aiBriefError ? (
                          <div className="text-red-500 text-xs mt-4">{aiBriefError}</div>
                        ) : aiBriefData ? (
                          <div className="mt-4"><AIBriefRenderer data={aiBriefData} /></div>
                        ) : (
                          <p className="text-sm text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">Select a neighborhood sector (RT) on the map to generate a tactical brief addressed to Ibu Kartini.</p>
                        )}
                     </div>
                  </div>
                </div>
            </div>
          ) : null}

          {activeBottomTab === 'rankings' && (
            <div className="p-8 h-full overflow-auto">
               <h2 className="text-2xl font-bold mb-6 tracking-tight text-stone-900 dark:text-stone-100">Priority Evacuation Register</h2>
               <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1A1A1A] shadow-sm">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-stone-50 dark:bg-[#111111] text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="px-4 py-3 font-bold">Priority Rank</th>
                      <th className="px-4 py-3 font-bold">RT Sector ID</th>
                      <th className="px-4 py-3 font-bold">Kelurahan</th>
                      <th className="px-4 py-3 font-bold">Elevation (m)</th>
                      <th className="px-4 py-3 font-bold">Rainfall (mm/hr)</th>
                      <th className="px-4 py-3 font-bold">EVT Exceedance</th>
                      <th className="px-4 py-3 font-bold text-red-500">Risk Score</th>
                      <th className="px-4 py-3 font-bold">Tactical Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {rankedRts.slice(0, 100).map((rt, index) => {
                      return (
                        <tr key={rt.rt_id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-stone-900 dark:text-stone-50">#{index + 1}</td>
                          <td className="px-4 py-3 font-mono text-stone-500 dark:text-stone-400">{rt.rt_id}</td>
                          <td className="px-4 py-3 font-medium">{rt.kelurahan}</td>
                          <td className="px-4 py-3 font-mono">{rt.demnas_elevation_m.toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono">{rt.interpolated_rainfall_mm_hr.toFixed(1)}</td>
                          <td className="px-4 py-3 font-mono text-orange-500">{(rt.evt_exceedance_prob * 100).toFixed(2)}%</td>
                          <td className="px-4 py-3 font-mono font-bold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-r-none">{(rt.risk_priority_score * 100).toFixed(2)}%</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDispatchPump(rt.rt_id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-colors ${
                                  rt.dispatched
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                    : "bg-white dark:bg-[#1A1A1A] border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                                }`}
                              >
                                {rt.dispatched ? "Pump: Dispatched" : "Deploy Pump"}
                              </button>
                              <button
                                onClick={() => handleToggleSiren(rt.rt_id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-colors ${
                                  rt.siren_activated
                                    ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse"
                                    : "bg-white dark:bg-[#1A1A1A] border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                                }`}
                              >
                                {rt.siren_activated ? "Siren: Pulsing" : "Alarm Siren"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeBottomTab === 'gev_inspector' && (
            <div className="p-8 h-full overflow-auto">
               <h2 className="text-2xl font-bold mb-6 tracking-tight text-stone-900 dark:text-stone-100">GEV Risk Inspector</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {computedSensors.map((sensor) => {
                  let siagaStatus = "SIAGA 4 (NORMAL)";
                  let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                  if (sensor.exceedance_prob > 0.8) {
                    siagaStatus = "SIAGA 1 (SEVERE)";
                    statusColor = "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse";
                  } else if (sensor.exceedance_prob > 0.5) {
                    siagaStatus = "SIAGA 2 (HIGH)";
                    statusColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
                  } else if (sensor.exceedance_prob > 0.2) {
                    siagaStatus = "SIAGA 3 (WARNING)";
                    statusColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                  }
                  return (
                    <div
                      key={sensor.sensor_id}
                      className="p-5 rounded-xl border bg-white dark:bg-[#1A1A1A] border-stone-200 dark:border-stone-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate pr-2">
                          {sensor.name}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                          {sensor.sensor_id}
                        </span>
                      </div>
                      <div className="space-y-3 text-xs">
                         <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-2">
                           <span className="text-stone-500 dark:text-stone-400">Water Level</span>
                           <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                             {sensor.water_level_cm.toFixed(1)} cm
                           </span>
                         </div>
                         <div className="flex justify-between items-center pb-2">
                           <span className="text-stone-500 dark:text-stone-400">Exceedance</span>
                           <span className="font-mono font-bold text-orange-500">
                             {(sensor.exceedance_prob * 100).toFixed(1)}%
                           </span>
                         </div>
                      </div>
                      <div className={`mt-2 border text-[10px] font-bold text-center py-2 rounded-lg ${statusColor}`}>
                        {siagaStatus}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeBottomTab === 'data_pipeline' && (
            <div className="p-8 h-full overflow-auto">
               <h2 className="text-2xl font-bold mb-6 tracking-tight text-stone-900 dark:text-stone-100">End-to-End Data Pipeline Architecture</h2>
               <div className="bg-white dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-2xl p-8 shadow-sm">
                 <PipelineDiagram />
               </div>
            </div>
          )}

          {activeBottomTab === 'python_core' && (
             <div className="h-full">
                <CodeExplorer />
             </div>
          )}

        </main>
      </div>

      {showGroundTruth && selectedSensor && (
        <GroundTruthModal
          sensor={selectedSensor}
          onClose={() => setShowGroundTruth(false)}
        />
      )}
      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={executeConfirmedAction}
          type={confirmModal.type}
          title={
            confirmModal.type === "pump"
              ? confirmModal.actionType === "activate"
                ? "Confirm Pump Deployment"
                : "Recall Pump"
              : confirmModal.type === "siren"
                ? confirmModal.actionType === "activate"
                  ? "Activate Warning Siren"
                  : "Deactivate Warning Siren"
                : confirmModal.actionType === "activate"
                  ? "Dispatch Evacuation Team"
                  : "Recall Evacuation Team"
          }
          message={
            confirmModal.type === "pump"
              ? confirmModal.actionType === "activate"
                ? `Are you sure you want to deploy a water pump to sector ${confirmModal.rtId}?`
                : `Are you sure you want to recall the water pump from sector ${confirmModal.rtId}?`
              : confirmModal.type === "siren"
                ? confirmModal.actionType === "activate"
                  ? `Are you sure you want to trigger the emergency siren for sector ${confirmModal.rtId}?`
                  : `Are you sure you want to silence the emergency siren for sector ${confirmModal.rtId}?`
                : confirmModal.actionType === "activate"
                  ? `Are you sure you want to dispatch an emergency evacuation team to sector ${confirmModal.rtId}?`
                  : `Are you sure you want to recall the evacuation team from sector ${confirmModal.rtId}?`
          }
          confirmLabel={
            confirmModal.actionType === "activate"
              ? "Confirm Dispatch"
              : "Confirm Recall"
          }
        />
      )}
    </div>
  );
}
"""

with open("src/Hud.tsx", "w") as f:
    f.write(before_return + new_return)
