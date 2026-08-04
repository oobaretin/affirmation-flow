import AppLogo from './AppLogo';
import './AppLogoLoader.css';

type AppLogoLoaderProps = {
  message?: string;
  size?: 'md' | 'lg';
};

const AppLogoLoader: React.FC<AppLogoLoaderProps> = ({ message, size = 'lg' }) => (
  <div className="app-logo-loader" role="status" aria-live="polite" aria-busy="true">
    <div className="app-logo-loader__stage">
      <div className="app-logo-loader__aura" aria-hidden="true">
        <span className="app-logo-loader__halo app-logo-loader__halo--near" />
        <span className="app-logo-loader__halo app-logo-loader__halo--far" />
      </div>
      <div className="app-logo-loader__mark">
        <AppLogo size={size} />
      </div>
    </div>
    {message ? <p className="app-logo-loader__message">{message}</p> : null}
  </div>
);

export default AppLogoLoader;
