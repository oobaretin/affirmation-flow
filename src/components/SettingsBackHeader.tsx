import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

type SettingsBackHeaderProps = {
  title: string;
};

const SettingsBackHeader: React.FC<SettingsBackHeaderProps> = ({ title }) => (
  <IonHeader>
    <IonToolbar>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/settings" text="Settings" />
      </IonButtons>
      <IonTitle>{title}</IonTitle>
    </IonToolbar>
  </IonHeader>
);

export default SettingsBackHeader;
