import { Redirect, Route } from 'react-router-dom';
import React from 'react';
import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import AppLogoLoader from './components/AppLogoLoader';
import { useMinimumLoaderDuration } from './hooks/useMinimumLoaderDuration';
import { IonReactRouter } from '@ionic/react-router';
import { settingsOutline, sunny, heart } from 'ionicons/icons';
import Today from './pages/Today';
import MyAffirmations from './pages/MyAffirmations';
import Settings from './pages/Settings';
import SettingsSubscription from './pages/settings/SettingsSubscription';
import SettingsPractice from './pages/settings/SettingsPractice';
import SettingsVoice from './pages/settings/SettingsVoice';
import SettingsReminders from './pages/settings/SettingsReminders';
import SettingsFocus from './pages/settings/SettingsFocus';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import Paywall from './pages/Paywall';
import { useSettings, SettingsProvider } from './hooks/useSettings';
import { CustomAffirmationsProvider } from './hooks/useCustomAffirmations';
import { FavoritesProvider } from './hooks/useFavorites';
import { SubscriptionProvider, useSubscription } from './hooks/useSubscription';
import { useKeyboardVisible } from './hooks/useKeyboardVisible';
import './App.css';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

import './theme/variables.css';

setupIonicReact();

const MainTabBar: React.FC = () => {
  const keyboardVisible = useKeyboardVisible();

  return (
    <IonTabBar
      slot="bottom"
      className={keyboardVisible ? 'tab-bar-keyboard-hidden' : undefined}
    >
      <IonTabButton tab="today" href="/today">
        <IonIcon aria-hidden="true" icon={sunny} />
        <IonLabel>Today</IonLabel>
      </IonTabButton>
      <IonTabButton tab="my" href="/my">
        <IonIcon aria-hidden="true" icon={heart} />
        <IonLabel>My</IonLabel>
      </IonTabButton>
      <IonTabButton tab="settings" href="/settings">
        <IonIcon aria-hidden="true" icon={settingsOutline} />
        <IonLabel>Settings</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

const AppRoutes: React.FC = () => {
  const { settings } = useSettings();
  const { loading: subscriptionLoading, isSubscribed } = useSubscription();
  const showBootLoader = useMinimumLoaderDuration(subscriptionLoading);

  let content: React.ReactNode;

  if (!settings.onboardingComplete) {
    content = (
      <IonRouterOutlet>
        <Route exact path="/onboarding">
          <Onboarding />
        </Route>
        <Route exact path="/privacy">
          <Privacy />
        </Route>
        <Route exact path="/">
          <Redirect to="/onboarding" />
        </Route>
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </IonRouterOutlet>
    );
  } else if (settings.onboardingComplete && showBootLoader) {
    content = (
      <IonPage>
        <IonContent fullscreen>
          <AppLogoLoader />
        </IonContent>
      </IonPage>
    );
  } else if (!isSubscribed) {
    content = (
      <IonRouterOutlet>
        <Route exact path="/paywall">
          <Paywall />
        </Route>
        <Route exact path="/privacy">
          <Privacy />
        </Route>
        <Route exact path="/">
          <Redirect to="/paywall" />
        </Route>
        <Route>
          <Redirect to="/paywall" />
        </Route>
      </IonRouterOutlet>
    );
  } else {
    content = (
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/today">
            <Today />
          </Route>
          <Route exact path="/my">
            <MyAffirmations />
          </Route>
          <Route exact path="/settings">
            <Settings />
          </Route>
          <Route exact path="/settings/subscription">
            <SettingsSubscription />
          </Route>
          <Route exact path="/settings/practice">
            <SettingsPractice />
          </Route>
          <Route exact path="/settings/voice">
            <SettingsVoice />
          </Route>
          <Route exact path="/settings/reminders">
            <SettingsReminders />
          </Route>
          <Route exact path="/settings/focus">
            <SettingsFocus />
          </Route>
          <Route exact path="/privacy">
            <Privacy />
          </Route>
          <Route exact path="/onboarding">
            <Redirect to="/today" />
          </Route>
          <Route exact path="/">
            <Redirect to="/today" />
          </Route>
        </IonRouterOutlet>
        <MainTabBar />
      </IonTabs>
    );
  }

  return content;
};

const App: React.FC = () => (
  <IonApp>
    <SettingsProvider>
      <CustomAffirmationsProvider>
        <FavoritesProvider>
          <SubscriptionProvider>
            <IonReactRouter>
              <AppRoutes />
            </IonReactRouter>
          </SubscriptionProvider>
        </FavoritesProvider>
      </CustomAffirmationsProvider>
    </SettingsProvider>
  </IonApp>
);

export default App;
