/** FIN-02 · 告警事件枢纽 partial 深度快照。 */
export function adminAlertIncidentsHubSnapshot(input: {
  urlIncidentId: string;
  buildLoading: boolean;
}) {
  const id = input.urlIncidentId.trim();
  return {
    syncedIncidentId: id || null,
    hasSyncedIncident: id.length > 0,
    buildLoading: input.buildLoading,
  };
}
