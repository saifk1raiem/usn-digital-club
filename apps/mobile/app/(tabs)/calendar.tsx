import { messages } from '@/src/i18n'; import { Empty, Screen } from '@/src/components'; export default function Calendar() { return <Screen><Empty text={messages.ar.noData} /></Screen>; }
