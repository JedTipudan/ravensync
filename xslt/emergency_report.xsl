<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <title>RavenSync Emergency Alert Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 2rem; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
          .header h1 { font-size: 2rem; font-weight: 700; color: white; }
          .header p { color: rgba(255,255,255,0.8); margin-top: 0.5rem; }
          .logo { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .stat-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1.5rem; text-align: center; }
          .stat-value { font-size: 2rem; font-weight: 700; color: #6366f1; }
          .stat-label { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
          .section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
          .section h2 { font-size: 1.2rem; font-weight: 600; color: #a78bfa; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; }
          th { background: rgba(99,102,241,0.2); color: #a78bfa; padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
          tr:hover td { background: rgba(255,255,255,0.03); }
          .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
          .badge-critical { background: rgba(239,68,68,0.2); color: #f87171; }
          .badge-high { background: rgba(245,158,11,0.2); color: #fbbf24; }
          .badge-medium { background: rgba(59,130,246,0.2); color: #60a5fa; }
          .badge-low { background: rgba(34,197,94,0.2); color: #4ade80; }
          .badge-active { background: rgba(239,68,68,0.2); color: #f87171; }
          .badge-resolved { background: rgba(34,197,94,0.2); color: #4ade80; }
          .badge-scheduled { background: rgba(99,102,241,0.2); color: #a78bfa; }
          .footer { text-align: center; color: #475569; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🦅 RavenSync</div>
          <h1>Emergency Alert Report</h1>
          <p>Generated: <xsl:value-of select="//Summary/GeneratedAt"/> | Platform: <xsl:value-of select="//Summary/Platform"/></p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value"><xsl:value-of select="//Summary/TotalAlerts"/></div>
            <div class="stat-label">Total Alerts</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#f87171"><xsl:value-of select="count(//Alert[@severity='critical'])"/></div>
            <div class="stat-label">Critical</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#fbbf24"><xsl:value-of select="count(//Alert[@severity='high'])"/></div>
            <div class="stat-label">High Severity</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:#4ade80"><xsl:value-of select="count(//Alert[Status='resolved'])"/></div>
            <div class="stat-label">Resolved</div>
          </div>
        </div>

        <div class="section">
          <h2>📋 Alert Records</h2>
          <table>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Area</th>
              <th>Created</th>
            </tr>
            <xsl:for-each select="//Alert">
              <tr>
                <td><xsl:value-of select="@id"/></td>
                <td><xsl:value-of select="Title"/></td>
                <td><xsl:value-of select="Type"/></td>
                <td>
                  <span>
                    <xsl:attribute name="class">badge badge-<xsl:value-of select="@severity"/></xsl:attribute>
                    <xsl:value-of select="@severity"/>
                  </span>
                </td>
                <td>
                  <span>
                    <xsl:attribute name="class">badge badge-<xsl:value-of select="Status"/></xsl:attribute>
                    <xsl:value-of select="Status"/>
                  </span>
                </td>
                <td><xsl:value-of select="AffectedArea"/></td>
                <td><xsl:value-of select="substring(CreatedAt, 1, 10)"/></td>
              </tr>
            </xsl:for-each>
          </table>
        </div>

        <div class="footer">
          <p>RavenSync Emergency Communication Platform | Confidential Report | Generated by XSLT Engine</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
