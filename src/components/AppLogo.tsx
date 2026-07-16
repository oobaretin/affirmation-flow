import './AppLogo.css';

type AppLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
};

const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '' }) => (
  <div className={`app-logo app-logo--${size} ${className}`.trim()} aria-hidden="true">
    <img src="/assets/logo.png" alt="AffirmEaze logo" />
  </div>
);

export default AppLogo;
