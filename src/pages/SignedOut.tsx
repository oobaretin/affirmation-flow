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
import { useSettings } from '../hooks/useSettings';
import { clearExplicitLogout, resumeSession } from '../services/session';
import './SignedOut.css';

const SignedOut: React.FC = () => {
  const history = useHistory();
  const { settings, login } = useSettings();
  const { custom } = useCustomAffirmations();

  const handleContinue = async () => {
    clearExplicitLogout();
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
      <IonContent fullscreen className="signed-out-content">
        <div className="signed-out-step">
          <AppLogo size="lg" className="signed-out-logo" />
          <h1>You&apos;ve locked the app</h1>
          <p>Your affirmations, favorites, and settings are still saved on this device.</p>

          <IonButton expand="block" size="large" onClick={handleContinue}>
            Unlock AffirmEaze
            <IonIcon slot="end" icon={arrowForward} />
          </IonButton>

          <IonText color="medium">
            <p className="signed-out-hint">
              When you return later, you&apos;ll see a welcome screen to pick up where you left off.
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SignedOut;
