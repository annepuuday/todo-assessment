import { API_URL } from "../api";
import Icon from "./Icon";

const features = [
  { icon: "list", text: "Capture tasks in seconds" },
  { icon: "checkCircle", text: "Track progress at a glance" },
  { icon: "shield", text: "Private to your GitHub account" },
];

export default function LoginPage({ notice }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-logo brand-logo-lg">
          <Icon name="logo" size={32} />
        </div>

        <p className="login-brand">TodoFlow</p>
        <h1>Welcome back</h1>
        <p className="login-description">
          Sign in to organize your work, manage your tasks and stay productive.
        </p>

        {notice && (
          <div className="alert alert-warning" role="status">
            <Icon name="alert" size={18} />
            <span>{notice}</span>
          </div>
        )}

        <a className="btn btn-github btn-block" href={`${API_URL}/auth/github`}>
          <Icon name="github" size={20} />
          Continue with GitHub
        </a>

        <ul className="login-features">
          {features.map((feature) => (
            <li key={feature.text}>
              <span className="login-feature-icon">
                <Icon name={feature.icon} size={16} />
              </span>
              {feature.text}
            </li>
          ))}
        </ul>

        <p className="login-footnote">
          <Icon name="shield" size={14} />
          Secure sign-in with GitHub OAuth
        </p>
      </div>
    </div>
  );
}
