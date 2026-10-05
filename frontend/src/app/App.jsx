import { useEffect, useState } from 'react';
import {
  LoginScreen,
  RegistrationScreen,
} from '../features/auth/AuthScreens';
import { ApiError, getSession, logout } from '../services/api';

function App() {
  const [screen, setScreen] = useState('login');
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((identity) => {
        if (isMounted) {
          setSession(identity);
        }
      })
      .catch((error) => {
        if (isMounted && !(error instanceof ApiError && error.status === 401)) {
          setSessionError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function navigateTo(nextScreen) {
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLogout() {
    await logout();
    setSession(null);
    setSessionError('');
    setLoginNotice('Sesión cerrada correctamente.');
  }

  function handleAuthenticated(identity) {
    setSession(identity);
    setSessionError('');
    setLoginNotice('');
  }

  function handleRegistered(type) {
    setSessionError('');
    setLoginNotice(
      `El registro de ${type} se guardó correctamente. Ahora podés iniciar sesión.`,
    );
    navigateTo('login');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            navigateTo('login');
          }}
          aria-label="UATRE, volver al inicio"
        >
          <span className="brand-mark" aria-hidden="true">U</span>
          <span className="brand-copy">
            <strong>UATRE</strong>
            <span>Gestión de personal eventual</span>
          </span>
        </a>
        <span className="prototype-badge">
          <span aria-hidden="true" className="badge-dot" />
          MVP conectado
        </span>
      </header>

      <main className="page-content">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <p className="eyebrow">TRABAJO RURAL · ORGANIZACIÓN · CONFIANZA</p>
          <h1 id="welcome-title">
            Cada jornada,
            <br />
            mejor organizada.
          </h1>
          <p className="welcome-copy">
            Un espacio para conectar a las seccionales de UATRE con las empresas
            y acompañar la gestión del personal eventual.
          </p>
          <div className="welcome-divider" />
          <p className="welcome-footnote">
            Por ahora podés crear cuentas e iniciar sesión; las vistas de
            gestión se incorporarán en la siguiente etapa.
          </p>
        </section>

        <section className="form-panel" aria-label="Acceso y registro">
          <div className="demo-notice" role="note">
            <span className="notice-icon" aria-hidden="true">i</span>
            <p>
              Los registros se guardan en PostgreSQL y el ingreso inicia una
              sesión real. Usá datos de prueba mientras se construyen las vistas.
            </p>
          </div>

          {screen === 'login' ? (
            <LoginScreen
              onNavigate={navigateTo}
              onAuthenticated={handleAuthenticated}
              onLogout={handleLogout}
              session={session}
              checkingSession={checkingSession}
              sessionError={sessionError}
              loginNotice={loginNotice}
              onClearLoginNotice={() => setLoginNotice('')}
            />
          ) : (
            <RegistrationScreen
              type={screen === 'register-company' ? 'company' : 'seccional'}
              onNavigate={navigateTo}
              onRegistered={handleRegistered}
            />
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>UATRE · Sistema de Gestión de Personal Eventual</span>
        <span>Acceso y registros conectados · Vistas principales pendientes</span>
      </footer>
    </div>
  );
}

export default App;
