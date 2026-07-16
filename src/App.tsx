import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { heart, library, settingsOutline, sunny } from 'ionicons/icons';
import Today from './pages/Today';
import Library from './pages/Library';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import WelcomeBack from './pages/WelcomeBack';
import SignedOut from './pages/SignedOut';
import Privacy from './pages/Privacy';
import { useSettings, SettingsProvider } from './hooks/useSettings';
import { getLoggedOutDefaultRoute, hasExplicitLogout } from './services/session';

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

const AppRoutes: React.FC = () => {
  const { settings } = useSettings();

  if (!settings.onboardingComplete) {
    return (
      <IonRouterOutlet>
        <Route exact path="/onboarding">
          <Onboarding />
        </Route>
        <Route exact path="/">
          <Redirect to="/onboarding" />
        </Route>
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </IonRouterOutlet>
    );
  }

  if (!settings.isLoggedIn) {
    const defaultRoute = getLoggedOutDefaultRoute(hasExplicitLogout());
    return (
      <IonRouterOutlet>
        <Route exact path="/signed-out">
          <SignedOut />
        </Route>
        <Route exact path="/welcome">
          <WelcomeBack />
        </Route>
        <Route exact path="/">
          <Redirect to={defaultRoute} />
        </Route>
        <Route>
          <Redirect to={defaultRoute} />
        </Route>
      </IonRouterOutlet>
    );
  }

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/today">
          <Today />
        </Route>
        <Route exact path="/library">
          <Library />
        </Route>
        <Route path="/favorites">
          <Favorites />
        </Route>
        <Route exact path="/settings">
          <Settings />
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
      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/today">
          <IonIcon aria-hidden="true" icon={sunny} />
          <IonLabel>Today</IonLabel>
        </IonTabButton>
        <IonTabButton tab="library" href="/library">
          <IonIcon aria-hidden="true" icon={library} />
          <IonLabel>Library</IonLabel>
        </IonTabButton>
        <IonTabButton tab="favorites" href="/favorites">
          <IonIcon aria-hidden="true" icon={heart} />
          <IonLabel>Favorites</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/settings">
          <IonIcon aria-hidden="true" icon={settingsOutline} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const App: React.FC = () => (
  <IonApp>
    <SettingsProvider>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </SettingsProvider>
  </IonApp>
);

export default App;
