export default async function handler(req, res) {
  const token = process.env.AHD_VERCEL_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'AHD_VERCEL_TOKEN not configured' });
  }

  const teamId = 'team_8aw5MZpeCayg8UKqk1oTOW07';
  const selfProject = 'ahd-portfolio';

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects?teamId=${teamId}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: 'Vercel API error', details: err });
    }

    const data = await response.json();
    const projects = (data.projects || [])
      .filter(p => p.name !== selfProject)
      .filter(p => {
        // Only include projects with a production deployment URL
        const target = (p.targets && p.targets.production) || {};
        return target.url || (p.latestDeployments && p.latestDeployments.length > 0);
      })
      .map(p => {
        const target = (p.targets && p.targets.production) || {};
        const aliases = (target.alias || []);

        // Prefer the clean {name}.vercel.app alias over hashed/scoped ones
        let bestUrl = null;
        const cleanAlias = aliases.find(a => a === `${p.name}.vercel.app`);
        if (cleanAlias) {
          bestUrl = `https://${cleanAlias}`;
        } else if (aliases.length > 0) {
          const sorted = [...aliases].sort((a, b) => a.length - b.length);
          bestUrl = `https://${sorted[0]}`;
        } else if (target.url) {
          bestUrl = `https://${target.url}`;
        } else if (p.latestDeployments && p.latestDeployments[0]) {
          bestUrl = `https://${p.latestDeployments[0].url}`;
        }

        return {
          name: p.name,
          url: bestUrl,
          description: p.description || ''
        };
      })
      .filter(p => p.url);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(projects);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch projects', message: err.message });
  }
}
