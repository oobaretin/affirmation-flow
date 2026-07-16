import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import AppLogo from '../components/AppLogo';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { resumeSession } from '../services/session';
import './WelcomeBack.css';

const WelcomeBack: React.FC = () => {
  const history = useHistory();
  const { settings, login } = useSettings();
  const { custom } = useCustomAffirmations();
  const { favorites } = useFavorites();

  const greeting = settings.name ? `Welcome back, ${settings.name}` : 'Welcome back';

  const handleContinue = async () => {
    login();
    await resumeSession(settings, custom);
    history.replace('/today');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AffirmEaze</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="welcome-back-content">
        <div className="welcome-back-step">
          <AppLogo size="lg" className="welcome-back-logo" />
          <h1>{greeting}</h1>
          <p>Your affirmations, favorites, and settings are right where you left them.</p>

          <div className="welcome-back-stats">
            <div className="welcome-back-stat">
              <strong>{custom.length}</strong>
              <span>Custom affirmations</span>
            </div>
            <div className="welcome-back-stat">
              <strong>{favorites.length}</strong>
              <span>Favorites</span>
            </div>
          </div>

          <IonButton expand="block" size="large" onClick={handleContinue}>
            Continue
            <IonIcon slot="end" icon={arrowForward} />
          </IonButton>

          <IonText color="medium">
            <p className="welcome-back-hint">
              Log out only pauses your session on this device. Your data stays here until you clear it in Settings.
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WelcomeBack;
