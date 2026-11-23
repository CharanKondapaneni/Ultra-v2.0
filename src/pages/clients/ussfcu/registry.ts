import type { ComponentType } from 'react'

import FionaAskPage           from './fiona/AskPage'
import FionaPortfolioRiskPage from './fiona/PortfolioRiskPage'
import FionaScenariosPage     from './fiona/ScenariosPage'
import FionaDataSourcesPage   from './fiona/DataSourcesPage'

import EvelynAskPage                from './evelyn/AskPage'
import EvelynComplianceQueryPage    from './evelyn/ComplianceQueryPage'
import EvelynDisclosureCalendarPage from './evelyn/DisclosureCalendarPage'
import EvelynDataSourcesPage        from './evelyn/DataSourcesPage'

import TimothyAskPage                from './timothy/AskPage'
import TimothyBusinessPerformancePage from './timothy/BusinessPerformancePage'
import TimothyPrioritySignalsPage     from './timothy/PrioritySignalsPage'
import TimothyDataSourcesPage         from './timothy/DataSourcesPage'

import SylviaAskPage from './sylvia/AskPage'
import SylviaDataFlowLineagePage from './sylvia/DataFlowLineagePage'
import SylviaGovernanceSignalsPage from './sylvia/GovernanceSignalsPage'
import SylviaDataSourcesPage from './sylvia/DataSourcesPage'

import NadiaAskPage from './nadia/AskPage'
import NadiaComplianceQueryPage from './nadia/ComplianceQueryPage'
import NadiaDisclosureCalendarPage from './nadia/DisclosureCalendarPage'
import NadiaDataSourcesPage from './nadia/DataSourcesPage'

export const ussfcuPages: Record<string, Record<string, ComponentType>> = {
  fiona: {
    '/ask':            FionaAskPage,
    '/portfolio-risk': FionaPortfolioRiskPage,
    '/scenarios':      FionaScenariosPage,
    '/data-sources':   FionaDataSourcesPage,
  },
  evelyn: {
    '/ask':                 EvelynAskPage,
    '/compliance-query':    EvelynComplianceQueryPage,
    '/disclosure-calendar': EvelynDisclosureCalendarPage,
    '/data-sources':        EvelynDataSourcesPage,
  },
  timothy: {
    '/ask':               TimothyAskPage,
    '/businessPerformance': TimothyBusinessPerformancePage,
    '/prioritySignals':     TimothyPrioritySignalsPage,
    '/data-sources':      TimothyDataSourcesPage,
  },
  sylvia: {
    '/ask': SylviaAskPage,
    '/dataflow' : SylviaDataFlowLineagePage,
    '/governanceSignals' : SylviaGovernanceSignalsPage,
    '/data-sources' : SylviaDataSourcesPage,
  },
  nadia: {
    '/ask':                 NadiaAskPage,
    '/compliance-query':    NadiaComplianceQueryPage,
    '/disclosure-calendar': NadiaDisclosureCalendarPage,
    '/data-sources':        NadiaDataSourcesPage,
  },
}
