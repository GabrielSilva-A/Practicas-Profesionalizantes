import { useEffect, useState } from 'react';
import {
  ApiError,
  getSeccionales,
  login,
  registerEmpresa,
  registerSeccional,
} from '../../services/api';

const initialSeccional = {
  numero: '',
  localidad: '',
  provincia: '',
  email: '',
  password: '',
  cantidad_numeros: '',
};

const initialCompany = {
  nombre: '',
  localidad: '',
  provincia: '',
  seccional_id: '',
  email: '',
  password: '',
};

const accountTypes = {
  EMPRESA: 'Empresa',
  SECCIONAL: 'Seccional',
};

function errorMessage(error) {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_EN_USO') {
      return 'Ese correo ya está registrado.';
    }
    if (error.code === 'SECCIONAL_DUPLICADA') {
      return 'Ese número de seccional ya está registrado.';
    }
    if (error.code === 'SECCIONAL_NO_DISPONIBLE') {
      return 'La seccional seleccionada no está disponible.';
    }
    if (error.code === 'CUENTA_INACTIVA') {
      return 'La cuenta está inactiva. Contactá a UATRE.';
    }
  }

  return error.message || 'No se pudo completar la solicitud.';
}

function Feedback({ message, isError = false }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`form-feedback${isError ? ' form-feedback-error' : ''}`}
      role={isError ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}

function LoginScreen({
  onNavigate,
  onAuthenticated,
  onLogout,
  session,
  checkingSession,
  sessionError,
  loginNotice,
  onClearLoginNotice,
}) {
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setNotice('');
    onClearLoginNotice();
    setIsSubmitting(true);

    try {
      const identity = await login(
        String(formData.get('email')),
        String(formData.get('password')),
      );
      form.reset();
      onAuthenticated(identity);
      setNotice('Sesión iniciada correctamente.');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setNotice('');
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  const visibleNotice = notice || loginNotice || sessionError;
  const isError = notice
    ? !notice.includes('correctamente')
    : !loginNotice && Boolean(sessionError);

  return (
    <div className="form-content">
      <div className="form-heading">
        <p className="eyebrow">BIENVENIDO/A</p>
        <h2>Ingresar</h2>
        <p>Acceso para seccionales y empresas registradas.</p>
      </div>

      {checkingSession && !session ? (
        <p className="form-feedback" role="status">
          Consultando si hay una sesión activa…
        </p>
      ) : session ? (
        <div className="active-session">
          <p className="form-feedback" role="status">
            Sesión iniciada correctamente.
          </p>
          <p>
            Acceso activo: <strong>{accountTypes[session.tipo] || session.tipo}</strong>
          </p>
          <p className="field-hint">
            Las vistas de gestión todavía no están disponibles.
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      ) : (
        <>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Correo electrónico</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@organizacion.com"
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ingresá tu contraseña"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verificando…' : 'Continuar'}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <Feedback message={visibleNotice} isError={isError} />

          <div className="form-separator">
            <span>¿Todavía no tenés una cuenta?</span>
          </div>

          <div className="registration-links">
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate('register-company')}
            >
              Registrar empresa
              <span aria-hidden="true">→</span>
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate('register-seccional')}
            >
              Registrar seccional
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <p className="worker-note">
            El alta de trabajadores la realiza UATRE. El ingreso de trabajadores
            queda fuera de esta etapa.
          </p>
        </>
      )}
    </div>
  );
}

function RegistrationScreen({ type, onNavigate, onRegistered }) {
  return type === 'company' ? (
    <CompanyRegistration
      onNavigate={onNavigate}
      onRegistered={onRegistered}
    />
  ) : (
    <SeccionalRegistration
      onNavigate={onNavigate}
      onRegistered={onRegistered}
    />
  );
}

function RegistrationHeading({ title, description, onNavigate }) {
  return (
    <div className="form-heading">
      <button
        className="back-link"
        type="button"
        onClick={() => onNavigate('login')}
      >
        <span aria-hidden="true">←</span> Volver al ingreso
      </button>
      <p className="eyebrow">REGISTRO PÚBLICO</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function CompanyRegistration({ onNavigate, onRegistered }) {
  const [form, setForm] = useState(initialCompany);
  const [seccionales, setSeccionales] = useState([]);
  const [selectorError, setSelectorError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoadingSeccionales, setIsLoadingSeccionales] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSeccionales()
      .then((items) => {
        if (isMounted) {
          setSeccionales(items);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSelectorError(errorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSeccionales(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice('');

    try {
      await registerEmpresa({
        ...form,
        seccional_id: Number(form.seccional_id),
      });
      setForm(initialCompany);
      onRegistered('la empresa');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-content">
      <RegistrationHeading
        title="Registrar empresa"
        description="Completá los datos de la empresa y su seccional."
        onNavigate={onNavigate}
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field field-wide">
            <span>Nombre de la empresa</span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={updateField}
              autoComplete="organization"
              maxLength="200"
              required
            />
          </label>
          <label className="field">
            <span>Localidad</span>
            <input
              name="localidad"
              value={form.localidad}
              onChange={updateField}
              autoComplete="address-level2"
              maxLength="100"
              required
            />
          </label>
          <label className="field">
            <span>Provincia</span>
            <input
              name="provincia"
              value={form.provincia}
              onChange={updateField}
              autoComplete="address-level1"
              maxLength="100"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Seccional</span>
          <select
            name="seccional_id"
            value={form.seccional_id}
            onChange={updateField}
            required
            disabled={isLoadingSeccionales || seccionales.length === 0}
          >
            <option value="">
              {isLoadingSeccionales
                ? 'Cargando seccionales…'
                : 'Seleccioná una seccional'}
            </option>
            {seccionales.map((seccional) => (
              <option key={seccional.id} value={seccional.id}>
                Seccional {seccional.numero} · {seccional.localidad},{' '}
                {seccional.provincia}
              </option>
            ))}
          </select>
          {selectorError ? (
            <small className="field-hint field-error">{selectorError}</small>
          ) : (
            <small className="field-hint">
              Se muestran seccionales activas registradas.
            </small>
          )}
        </label>

        <label className="field">
          <span>Correo electrónico</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            maxLength="200"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            required
          />
          <small className="field-hint">
            La contraseña se guarda protegida; no se exige una regla adicional
            de longitud en este MVP. Límite técnico: 72 bytes.
          </small>
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting || isLoadingSeccionales || seccionales.length === 0}
        >
          {isSubmitting ? 'Guardando…' : 'Crear cuenta de empresa'}
          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <Feedback message={notice} isError />

      <p className="form-switch">
        ¿Ya tenés una cuenta?{' '}
        <button
          className="inline-button"
          type="button"
          onClick={() => onNavigate('login')}
        >
          Volver al ingreso
        </button>
      </p>
    </div>
  );
}

function SeccionalRegistration({ onNavigate, onRegistered }) {
  const [form, setForm] = useState(initialSeccional);
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice('');

    try {
      await registerSeccional({
        ...form,
        numero: Number(form.numero),
        cantidad_numeros: Number(form.cantidad_numeros),
      });
      setForm(initialSeccional);
      onRegistered('la seccional');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-content">
      <RegistrationHeading
        title="Registrar seccional"
        description="Creá el acceso inicial de la seccional a la plataforma."
        onNavigate={onNavigate}
      />

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field">
            <span>Número de seccional</span>
            <input
              name="numero"
              type="number"
              min="1"
              step="1"
              value={form.numero}
              onChange={updateField}
              required
            />
          </label>
          <label className="field">
            <span>Cantidad de números</span>
            <input
              name="cantidad_numeros"
              type="number"
              min="1"
              step="1"
              value={form.cantidad_numeros}
              onChange={updateField}
              required
            />
          </label>
          <label className="field">
            <span>Localidad</span>
            <input
              name="localidad"
              value={form.localidad}
              onChange={updateField}
              autoComplete="address-level2"
              maxLength="100"
              required
            />
          </label>
          <label className="field">
            <span>Provincia</span>
            <input
              name="provincia"
              value={form.provincia}
              onChange={updateField}
              autoComplete="address-level1"
              maxLength="100"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Correo electrónico</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            maxLength="200"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            required
          />
          <small className="field-hint">
            La contraseña se guarda protegida; no se exige una regla adicional
            de longitud en este MVP. Límite técnico: 72 bytes.
          </small>
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando…' : 'Crear cuenta de seccional'}
          {!isSubmitting && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <Feedback message={notice} isError />

      <p className="form-switch">
        ¿Ya tenés una cuenta?{' '}
        <button
          className="inline-button"
          type="button"
          onClick={() => onNavigate('login')}
        >
          Volver al ingreso
        </button>
      </p>
    </div>
  );
}

export { LoginScreen, RegistrationScreen };
