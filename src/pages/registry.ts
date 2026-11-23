import type { ComponentType } from 'react'

import FionaAskPage                  from './clients/ussfcu/fiona/AskPage'
import FionaPortfolioRiskPage        from './clients/ussfcu/fiona/PortfolioRiskPage'
import FionaScenariosPage            from './clients/ussfcu/fiona/ScenariosPage'
import FionaDataSourcesPage          from './clients/ussfcu/fiona/DataSourcesPage'

import EvelynAskPage                 from './clients/ussfcu/evelyn/AskPage'
import EvelynComplianceQueryPage     from './clients/ussfcu/evelyn/ComplianceQueryPage'
import EvelynDisclosureCalendarPage  from './clients/ussfcu/evelyn/DisclosureCalendarPage'
import EvelynDataSourcesPage         from './clients/ussfcu/evelyn/DataSourcesPage'

import TimothyAskPage                from './clients/ussfcu/timothy/AskPage'
import TimothyBusinessPerformancePage from './clients/ussfcu/timothy/BusinessPerformancePage'
import TimothyPrioritySignalsPage    from './clients/ussfcu/timothy/PrioritySignalsPage'
import TimothyDataSourcesPage        from './clients/ussfcu/timothy/DataSourcesPage'

import SylviaAskPage                 from './clients/ussfcu/sylvia/AskPage'
import SylviaDataFlowLineagePage     from './clients/ussfcu/sylvia/DataFlowLineagePage'
import SylviaGovernanceSignalsPage   from './clients/ussfcu/sylvia/GovernanceSignalsPage'
import SylviaDataSourcesPage         from './clients/ussfcu/sylvia/DataSourcesPage'

import NadiaAskPage                  from './clients/ussfcu/nadia/AskPage'
import NadiaComplianceQueryPage      from './clients/ussfcu/nadia/ComplianceQueryPage'
import NadiaDisclosureCalendarPage   from './clients/ussfcu/nadia/DisclosureCalendarPage'
import NadiaDataSourcesPage          from './clients/ussfcu/nadia/DataSourcesPage'

// nfcu pages — add imports here as pages are built with /build-page

// penfed pages - add imports here as pages are built with /build-page
import MayaAskPage                    from './clients/penfed/maya/AskPage'
import MayaMemberJourney              from './clients/penfed/maya/MemberJourneyPage'
import MayaRiskSignals                from './clients/penfed/maya/RiskSignalsPage'
import MayaDataSources                from './clients/penfed/maya/DataSourcesPage'

import PriyaAskPage                   from './clients/penfed/priya/AskPage'
import PriyaMemberJourney             from './clients/penfed/priya/MemberJourneyPage'
import PriyaRiskSignals               from './clients/penfed/priya/RiskSignalsPage'
import PriyaDataSources               from './clients/penfed/priya/DataSourcesPage'

import DerekAskPage                   from './clients/penfed/derek/AskPage'
import DerekMemberJourney             from './clients/penfed/derek/MemberJourneyPage'
import DerekRiskSignals               from './clients/penfed/derek/RiskSignalsPage'
import DerekDataSources               from './clients/penfed/derek/DataSourcesPage'

import JamesAskPage                   from './clients/penfed/james/AskPage'
import JamesMemberJourney             from './clients/penfed/james/MemberJourneyPage'
import JamesRiskSignals               from './clients/penfed/james/RiskSignalsPage'
import JamesDataSources               from './clients/penfed/james/DataSourcesPage'

import SowmyaAskPage                  from './clients/penfed/sowmya/AskPage'
import SowmyaMemberJourney            from './clients/penfed/sowmya/MemberJourneyPage'
import SowmyaRiskSignals              from './clients/penfed/sowmya/RiskSignalsPage'
import SowmyaDataSources              from './clients/penfed/sowmya/DataSourcesPage'

export type PageRegistry = Record<string, Record<string, Record<string, ComponentType>>>

const registry: PageRegistry = {
  ussfcu: {
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
      '/ask':                   TimothyAskPage,
      '/businessPerformance':   TimothyBusinessPerformancePage,
      '/prioritySignals':       TimothyPrioritySignalsPage,
      '/data-sources':          TimothyDataSourcesPage,
    },
    sylvia: {
      '/ask':               SylviaAskPage,
      '/dataflow':          SylviaDataFlowLineagePage,
      '/governanceSignals': SylviaGovernanceSignalsPage,
      '/data-sources':      SylviaDataSourcesPage,
    },
    nadia: {
      '/ask':                 NadiaAskPage,
      '/compliance-query':    NadiaComplianceQueryPage,
      '/disclosure-calendar': NadiaDisclosureCalendarPage,
      '/data-sources':        NadiaDataSourcesPage,
    },
  },

  nfcu: {
    // Pages will be added here as they are built
  },

  penfed: {
    maya: {
      '/ask':            MayaAskPage,
      '/member-journey': MayaMemberJourney,
      '/risk-signals':   MayaRiskSignals,
      '/data-sources':   MayaDataSources,
    },
    priya: {
      '/ask':            PriyaAskPage,
      '/member-journey': PriyaMemberJourney,
      '/risk-signals':   PriyaRiskSignals,
      '/data-sources':   PriyaDataSources,
    },
    derek: {
      '/ask':            DerekAskPage,
      '/member-journey': DerekMemberJourney,
      '/risk-signals':   DerekRiskSignals,
      '/data-sources':   DerekDataSources,
    },
    james: {
      '/ask':            JamesAskPage,
      '/member-journey': JamesMemberJourney,
      '/risk-signals':   JamesRiskSignals,
      '/data-sources':   JamesDataSources,
    },
    sowmya: {
      '/ask':            SowmyaAskPage,
      '/member-journey': SowmyaMemberJourney,
      '/risk-signals':   SowmyaRiskSignals,
      '/data-sources':   SowmyaDataSources,
    },
  }
}

export default registry
