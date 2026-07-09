'use strict';

/**
 * Archive CMS UAT artifacts (announcements + roadmap milestones) so public pages stay clean.
 * Slug prefixes: cms-uat-* · roadmap-uat-*
 */

async function archiveMatchingAnnouncements(req, token, slugPrefix) {
  const list = await req('GET', '/api/v1/admin/content/announcements?lane=product', null, token);
  if (list.status !== 200) {
    return { archived: 0, error: `list HTTP ${list.status}` };
  }
  const items = list.json?.items || [];
  let archived = 0;
  const slugs = [];
  for (const row of items) {
    if (!row.slug?.startsWith(slugPrefix)) continue;
    if (row.publish_status === 'archived') continue;
    const r = await req(
      'POST',
      `/api/v1/admin/content/announcements/${row.id}/archive`,
      { version: row.version },
      token,
    );
    if (r.status === 200 && r.json?.status === 'ok') {
      archived += 1;
      slugs.push(row.slug);
    }
  }
  return { archived, slugs };
}

async function archiveMatchingRoadmapMilestones(req, token, slugPrefix) {
  const list = await req('GET', '/api/v1/admin/content/roadmap/milestones', null, token);
  if (list.status !== 200) {
    return { archived: 0, error: `list HTTP ${list.status}` };
  }
  const items = list.json?.items || [];
  let archived = 0;
  const slugs = [];
  for (const row of items) {
    if (!row.slug?.startsWith(slugPrefix)) continue;
    if (row.publish_status === 'archived') continue;
    const r = await req(
      'POST',
      `/api/v1/admin/content/roadmap/milestones/${row.id}/archive`,
      { version: row.version },
      token,
    );
    if (r.status === 200 && r.json?.status === 'ok') {
      archived += 1;
      slugs.push(row.slug);
    }
  }
  return { archived, slugs };
}

async function teardownCmsUatArtifacts(req, token) {
  const announcements = await archiveMatchingAnnouncements(req, token, 'cms-uat-');
  const milestones = await archiveMatchingRoadmapMilestones(req, token, 'roadmap-uat-');
  return {
    announcements,
    milestones,
    totalArchived: announcements.archived + milestones.archived,
  };
}

module.exports = {
  archiveMatchingAnnouncements,
  archiveMatchingRoadmapMilestones,
  teardownCmsUatArtifacts,
};
