import { registerPlugin } from '@capacitor/core';

export type TodayWidgetPayload = {
  text: string;
  category: string;
};

type TodayWidgetPlugin = {
  updateToday: (payload: TodayWidgetPayload) => Promise<void>;
};

const TodayWidget = registerPlugin<TodayWidgetPlugin>('TodayWidget', {
  web: () => ({
    updateToday: async () => undefined,
  }),
});

export async function updateTodayWidget(payload: TodayWidgetPayload): Promise<void> {
  try {
    await TodayWidget.updateToday(payload);
  } catch {
    // Widget bridge unavailable on this platform/build
  }
}
