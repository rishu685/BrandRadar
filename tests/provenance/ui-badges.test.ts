import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportStatusBadge } from '@/components/reports/reportsTable';
import { ReportProvenanceNotice } from '@/app/(routes)/(dashboard)/reports/[reportId]/page';

describe('UI Provenance Badges and Notices', () => {
  describe('ReportStatusBadge', () => {
    it('should render "Live Audit" badge for LIVE provenance', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'completed',
          provenance: 'LIVE',
          progress: 100,
        }),
      );

      expect(html).toContain('Live Audit');
      expect(html).toContain('bg-emerald-500/10');
    });

    it('should render "AI Estimate" badge for AI_GENERATED provenance', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'completed',
          provenance: 'AI_GENERATED',
          progress: 100,
        }),
      );

      expect(html).toContain('AI Estimate');
      expect(html).toContain('bg-indigo-500/10');
    });

    it('should render "Demo" badge for DEMO provenance', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'completed',
          provenance: 'DEMO',
          progress: 100,
        }),
      );

      expect(html).toContain('Demo');
      expect(html).toContain('border-amber-500/30');
    });

    it('should render "Legacy" badge for UNKNOWN provenance or missing provenance', () => {
      const htmlUnknown = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'completed',
          provenance: 'UNKNOWN',
          progress: 100,
        }),
      );

      expect(htmlUnknown).toContain('Legacy');

      const htmlUndefined = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'completed',
          progress: 100,
        }),
      );

      expect(htmlUndefined).toContain('Legacy');
    });

    it('should render Failed badge when status is failed', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportStatusBadge, {
          status: 'failed',
          progress: 100,
        }),
      );

      expect(html).toContain('Failed');
    });
  });

  describe('ReportProvenanceNotice', () => {
    it('should render prominent warning for DEMO reports', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportProvenanceNotice, { provenance: 'DEMO' }),
      );

      expect(html).toContain('Simulated Demo Report');
      expect(html).toContain('simulated benchmark data');
    });

    it('should render explanation for AI_GENERATED reports', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportProvenanceNotice, { provenance: 'AI_GENERATED' }),
      );

      expect(html).toContain('AI Model Estimation');
      expect(html).toContain('does not represent independently collected live SERP observations');
    });

    it('should render legacy warning for UNKNOWN reports', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportProvenanceNotice, { provenance: 'UNKNOWN' }),
      );

      expect(html).toContain('Legacy Report');
      expect(html).toContain('Execution provenance cannot be independently verified');
    });

    it('should render verified audit indicator for LIVE reports', () => {
      const html = renderToStaticMarkup(
        React.createElement(ReportProvenanceNotice, { provenance: 'LIVE' }),
      );

      expect(html).toContain('Verified live search audit');
    });
  });
});
