import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { APP_NAME, SUPPORT_EMAIL } from '../constants/app';
import './Privacy.css';

const Privacy: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/settings" />
        </IonButtons>
        <IonTitle>Privacy Policy</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen className="privacy-content">
      <div className="privacy-body">
        <p className="privacy-updated">Last updated: July 2026</p>

        <h2>Overview</h2>
        <p>
          {APP_NAME} is designed as a local-first affirmation app. Your affirmations, favorites,
          settings, and practice data are stored on your device — not on our servers.
        </p>

        <h2>Data we store on your device</h2>
        <ul>
          <li>Your name and practice preferences</li>
          <li>Custom and favorite affirmations</li>
          <li>Daily streak and pinned affirmation choices</li>
          <li>Notification schedule preferences</li>
        </ul>

        <h2>Data that may leave your device</h2>
        <p>
          <strong>AI Generator (optional):</strong> If you configure an OpenAI API key, your
          intention text and selected categories are sent to OpenAI to generate affirmations.
          Without an API key, generation runs locally using built-in templates only.
        </p>
        <p>
          <strong>Share:</strong> When you share an affirmation, your device&apos;s share sheet
          or clipboard is used. We do not receive shared content.
        </p>
        <p>
          <strong>Voice:</strong> Affirmations are spoken using your device&apos;s built-in
          text-to-speech. Audio is processed on-device.
        </p>

        <h2>Notifications</h2>
        <p>
          If enabled, {APP_NAME} schedules local reminders on your device. We do not send push
          notifications from a remote server.
        </p>

        <h2>Account &amp; cloud sync</h2>
        <p>
          {APP_NAME} does not require an account and does not offer cloud backup in v1. Locking
          the app only pauses your session on this device.
        </p>

        <h2>Children&apos;s privacy</h2>
        <p>{APP_NAME} is intended for a general audience and does not knowingly collect data from children under 13.</p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </IonContent>
  </IonPage>
);

export default Privacy;
