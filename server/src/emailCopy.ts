import { emailButton, EMAIL_COLORS, paragraph, renderEmail } from './emailLayout.js';
import { escapeHtml } from './email.js';

/** Same languages as the site (and MindKeep). */
export const MAIL_LOCALES = ['en', 'fi', 'uk', 'ru', 'pl', 'de', 'fr', 'it', 'es'] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];
export type AuthMailKind = 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change' | 'reauthentication';

export function resolveMailLocale(value?: unknown): MailLocale {
  const raw = typeof value === 'string' ? value.toLowerCase().slice(0, 2) : '';
  if (raw === 'ua') return 'uk';
  return (MAIL_LOCALES as readonly string[]).includes(raw) ? (raw as MailLocale) : 'en';
}

type Copy = { subject: string; heading: string; body: string; button: string; ignore: string };

const COPY: Record<AuthMailKind, Record<MailLocale, Copy>> = {
  signup: {
    en: { subject: "Confirm your Bookeep account", heading: "Welcome to Bookeep", body: "Confirm your email to finish creating your account and start reading.", button: "Confirm email", ignore: "If you did not sign up for Bookeep, just ignore this email." },
    fi: { subject: "Vahvista Bookeep-tilisi", heading: "Tervetuloa Bookeepiin", body: "Vahvista sähköpostiosoitteesi, niin tilisi on valmis ja voit aloittaa lukemisen.", button: "Vahvista sähköposti", ignore: "Jos et rekisteröitynyt Bookeepiin, voit jättää tämän viestin huomiotta." },
    uk: { subject: "Підтвердіть акаунт Bookeep", heading: "Вітаємо в Bookeep", body: "Підтвердіть пошту, щоб завершити реєстрацію та почати читати.", button: "Підтвердити пошту", ignore: "Якщо ви не реєструвалися в Bookeep, просто проігноруйте цей лист." },
    ru: { subject: "Подтвердите аккаунт Bookeep", heading: "Добро пожаловать в Bookeep", body: "Подтвердите почту, чтобы завершить регистрацию и начать читать.", button: "Подтвердить почту", ignore: "Если вы не регистрировались в Bookeep, просто проигнорируйте это письмо." },
    pl: { subject: "Potwierdź konto Bookeep", heading: "Witamy w Bookeep", body: "Potwierdź adres e-mail, aby dokończyć zakładanie konta i zacząć czytać.", button: "Potwierdź e-mail", ignore: "Jeśli nie zakładałeś konta w Bookeep, po prostu zignoruj tę wiadomość." },
    de: { subject: "Bestätige dein Bookeep-Konto", heading: "Willkommen bei Bookeep", body: "Bestätige deine E-Mail-Adresse, um dein Konto fertig einzurichten und mit dem Lesen zu beginnen.", button: "E-Mail bestätigen", ignore: "Wenn du dich nicht bei Bookeep registriert hast, ignoriere diese E-Mail einfach." },
    fr: { subject: "Confirmez votre compte Bookeep", heading: "Bienvenue sur Bookeep", body: "Confirmez votre adresse e-mail pour terminer la création de votre compte et commencer à lire.", button: "Confirmer l’e-mail", ignore: "Si vous ne vous êtes pas inscrit sur Bookeep, ignorez simplement cet e-mail." },
    it: { subject: "Conferma il tuo account Bookeep", heading: "Benvenuto su Bookeep", body: "Conferma la tua e-mail per completare la creazione dell’account e iniziare a leggere.", button: "Conferma e-mail", ignore: "Se non ti sei registrato su Bookeep, ignora pure questa e-mail." },
    es: { subject: "Confirma tu cuenta de Bookeep", heading: "Te damos la bienvenida a Bookeep", body: "Confirma tu correo para terminar de crear tu cuenta y empezar a leer.", button: "Confirmar correo", ignore: "Si no te registraste en Bookeep, simplemente ignora este correo." },
  },
  recovery: {
    en: { subject: "Reset your Bookeep password", heading: "Reset your password", body: "We received a request to reset your password. The link works for one hour.", button: "Set a new password", ignore: "If you did not ask for this, ignore this email. Your password stays the same." },
    fi: { subject: "Nollaa Bookeep-salasanasi", heading: "Salasanan nollaus", body: "Saimme pyynnön nollata salasanasi. Linkki toimii tunnin ajan.", button: "Aseta uusi salasana", ignore: "Jos et pyytänyt tätä, jätä viesti huomiotta. Salasanasi pysyy ennallaan." },
    uk: { subject: "Скидання пароля Bookeep", heading: "Скидання пароля", body: "Ми отримали запит на скидання пароля. Посилання діє одну годину.", button: "Задати новий пароль", ignore: "Якщо ви цього не робили, проігноруйте лист. Пароль залишиться тим самим." },
    ru: { subject: "Сброс пароля Bookeep", heading: "Сброс пароля", body: "Мы получили запрос на сброс пароля. Ссылка действует один час.", button: "Задать новый пароль", ignore: "Если вы этого не делали, проигнорируйте письмо. Пароль останется прежним." },
    pl: { subject: "Zresetuj hasło Bookeep", heading: "Reset hasła", body: "Otrzymaliśmy prośbę o zresetowanie hasła. Link działa przez godzinę.", button: "Ustaw nowe hasło", ignore: "Jeśli to nie ty, zignoruj tę wiadomość. Hasło się nie zmieni." },
    de: { subject: "Bookeep-Passwort zurücksetzen", heading: "Passwort zurücksetzen", body: "Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Der Link ist eine Stunde gültig.", button: "Neues Passwort festlegen", ignore: "Wenn du das nicht angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert." },
    fr: { subject: "Réinitialisez votre mot de passe Bookeep", heading: "Réinitialiser le mot de passe", body: "Nous avons reçu une demande de réinitialisation de votre mot de passe. Le lien est valable une heure.", button: "Choisir un nouveau mot de passe", ignore: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail. Votre mot de passe reste inchangé." },
    it: { subject: "Reimposta la password di Bookeep", heading: "Reimposta la password", body: "Abbiamo ricevuto una richiesta di reimpostazione della password. Il link è valido per un’ora.", button: "Imposta una nuova password", ignore: "Se non sei stato tu, ignora questa e-mail. La password resta invariata." },
    es: { subject: "Restablece tu contraseña de Bookeep", heading: "Restablecer la contraseña", body: "Recibimos una solicitud para restablecer tu contraseña. El enlace funciona durante una hora.", button: "Crear una contraseña nueva", ignore: "Si no lo pediste tú, ignora este correo. Tu contraseña seguirá igual." },
  },
  magiclink: {
    en: { subject: "Your Bookeep sign-in link", heading: "Sign in to Bookeep", body: "Use the button below to sign in. The link works once.", button: "Sign in", ignore: "If you did not ask to sign in, ignore this email." },
    fi: { subject: "Bookeep-kirjautumislinkkisi", heading: "Kirjaudu Bookeepiin", body: "Kirjaudu sisään alla olevasta painikkeesta. Linkki toimii kerran.", button: "Kirjaudu", ignore: "Jos et pyytänyt kirjautumista, jätä viesti huomiotta." },
    uk: { subject: "Посилання для входу в Bookeep", heading: "Вхід у Bookeep", body: "Натисніть кнопку нижче, щоб увійти. Посилання одноразове.", button: "Увійти", ignore: "Якщо ви не намагалися увійти, проігноруйте цей лист." },
    ru: { subject: "Ссылка для входа в Bookeep", heading: "Вход в Bookeep", body: "Нажмите кнопку ниже, чтобы войти. Ссылка одноразовая.", button: "Войти", ignore: "Если вы не пытались войти, проигнорируйте это письмо." },
    pl: { subject: "Twój link do logowania w Bookeep", heading: "Zaloguj się do Bookeep", body: "Kliknij przycisk poniżej, aby się zalogować. Link działa jeden raz.", button: "Zaloguj się", ignore: "Jeśli nie próbowałeś się zalogować, zignoruj tę wiadomość." },
    de: { subject: "Dein Anmeldelink für Bookeep", heading: "Bei Bookeep anmelden", body: "Melde dich über den Button unten an. Der Link funktioniert einmal.", button: "Anmelden", ignore: "Wenn du keine Anmeldung angefordert hast, ignoriere diese E-Mail." },
    fr: { subject: "Votre lien de connexion Bookeep", heading: "Se connecter à Bookeep", body: "Utilisez le bouton ci-dessous pour vous connecter. Le lien fonctionne une seule fois.", button: "Se connecter", ignore: "Si vous n’avez pas demandé à vous connecter, ignorez cet e-mail." },
    it: { subject: "Il tuo link di accesso a Bookeep", heading: "Accedi a Bookeep", body: "Usa il pulsante qui sotto per accedere. Il link funziona una sola volta.", button: "Accedi", ignore: "Se non hai chiesto di accedere, ignora questa e-mail." },
    es: { subject: "Tu enlace para entrar en Bookeep", heading: "Entrar en Bookeep", body: "Usa el botón de abajo para iniciar sesión. El enlace funciona una sola vez.", button: "Iniciar sesión", ignore: "Si no pediste iniciar sesión, ignora este correo." },
  },
  invite: {
    en: { subject: "You are invited to Bookeep", heading: "You are invited to Bookeep", body: "Accept the invitation to create your account.", button: "Accept invitation", ignore: "If you were not expecting this, ignore this email." },
    fi: { subject: "Sinut on kutsuttu Bookeepiin", heading: "Kutsu Bookeepiin", body: "Hyväksy kutsu luodaksesi tilin.", button: "Hyväksy kutsu", ignore: "Jos et odottanut tätä, jätä viesti huomiotta." },
    uk: { subject: "Запрошення до Bookeep", heading: "Запрошення до Bookeep", body: "Прийміть запрошення, щоб створити акаунт.", button: "Прийняти запрошення", ignore: "Якщо ви на це не чекали, проігноруйте лист." },
    ru: { subject: "Приглашение в Bookeep", heading: "Приглашение в Bookeep", body: "Примите приглашение, чтобы создать аккаунт.", button: "Принять приглашение", ignore: "Если вы этого не ждали, проигнорируйте письмо." },
    pl: { subject: "Zaproszenie do Bookeep", heading: "Zaproszenie do Bookeep", body: "Przyjmij zaproszenie, aby założyć konto.", button: "Przyjmij zaproszenie", ignore: "Jeśli się tego nie spodziewałeś, zignoruj tę wiadomość." },
    de: { subject: "Du bist zu Bookeep eingeladen", heading: "Einladung zu Bookeep", body: "Nimm die Einladung an, um dein Konto zu erstellen.", button: "Einladung annehmen", ignore: "Wenn du das nicht erwartet hast, ignoriere diese E-Mail." },
    fr: { subject: "Vous êtes invité sur Bookeep", heading: "Invitation sur Bookeep", body: "Acceptez l’invitation pour créer votre compte.", button: "Accepter l’invitation", ignore: "Si vous ne vous y attendiez pas, ignorez cet e-mail." },
    it: { subject: "Sei invitato su Bookeep", heading: "Invito su Bookeep", body: "Accetta l’invito per creare il tuo account.", button: "Accetta l’invito", ignore: "Se non te lo aspettavi, ignora questa e-mail." },
    es: { subject: "Te han invitado a Bookeep", heading: "Invitación a Bookeep", body: "Acepta la invitación para crear tu cuenta.", button: "Aceptar invitación", ignore: "Si no lo esperabas, ignora este correo." },
  },
  email_change: {
    en: { subject: "Confirm your new Bookeep email", heading: "Confirm the email change", body: "Confirm that this address should be used for your Bookeep account.", button: "Confirm change", ignore: "If you did not ask to change your email, ignore this email." },
    fi: { subject: "Vahvista uusi Bookeep-sähköpostisi", heading: "Vahvista sähköpostin vaihto", body: "Vahvista, että tätä osoitetta käytetään Bookeep-tililläsi.", button: "Vahvista vaihto", ignore: "Jos et pyytänyt vaihtoa, jätä viesti huomiotta." },
    uk: { subject: "Підтвердіть нову пошту Bookeep", heading: "Підтвердіть зміну пошти", body: "Підтвердіть, що ця адреса має використовуватися для вашого акаунта Bookeep.", button: "Підтвердити зміну", ignore: "Якщо ви не змінювали пошту, проігноруйте лист." },
    ru: { subject: "Подтвердите новую почту Bookeep", heading: "Подтвердите смену почты", body: "Подтвердите, что этот адрес будет использоваться для вашего аккаунта Bookeep.", button: "Подтвердить смену", ignore: "Если вы не меняли почту, проигнорируйте письмо." },
    pl: { subject: "Potwierdź nowy e-mail w Bookeep", heading: "Potwierdź zmianę e-maila", body: "Potwierdź, że ten adres ma być używany na twoim koncie Bookeep.", button: "Potwierdź zmianę", ignore: "Jeśli nie zmieniałeś adresu, zignoruj tę wiadomość." },
    de: { subject: "Bestätige deine neue Bookeep-E-Mail", heading: "E-Mail-Änderung bestätigen", body: "Bestätige, dass diese Adresse für dein Bookeep-Konto verwendet werden soll.", button: "Änderung bestätigen", ignore: "Wenn du keine Änderung angefordert hast, ignoriere diese E-Mail." },
    fr: { subject: "Confirmez votre nouvel e-mail Bookeep", heading: "Confirmer le changement d’e-mail", body: "Confirmez que cette adresse doit être utilisée pour votre compte Bookeep.", button: "Confirmer le changement", ignore: "Si vous n’avez pas demandé ce changement, ignorez cet e-mail." },
    it: { subject: "Conferma la nuova e-mail di Bookeep", heading: "Conferma il cambio di e-mail", body: "Conferma che questo indirizzo deve essere usato per il tuo account Bookeep.", button: "Conferma il cambio", ignore: "Se non hai chiesto di cambiare e-mail, ignora questo messaggio." },
    es: { subject: "Confirma tu nuevo correo de Bookeep", heading: "Confirmar el cambio de correo", body: "Confirma que esta dirección se usará en tu cuenta de Bookeep.", button: "Confirmar cambio", ignore: "Si no pediste cambiar tu correo, ignora este mensaje." },
  },
  reauthentication: {
    en: { subject: "Your Bookeep confirmation code", heading: "Confirmation code", body: "Enter this code to confirm the action:", button: "", ignore: "If you did not ask for a code, ignore this email." },
    fi: { subject: "Bookeep-vahvistuskoodisi", heading: "Vahvistuskoodi", body: "Syötä tämä koodi vahvistaaksesi toiminnon:", button: "", ignore: "Jos et pyytänyt koodia, jätä viesti huomiotta." },
    uk: { subject: "Код підтвердження Bookeep", heading: "Код підтвердження", body: "Введіть цей код, щоб підтвердити дію:", button: "", ignore: "Якщо ви не запитували код, проігноруйте лист." },
    ru: { subject: "Код подтверждения Bookeep", heading: "Код подтверждения", body: "Введите этот код, чтобы подтвердить действие:", button: "", ignore: "Если вы не запрашивали код, проигнорируйте письмо." },
    pl: { subject: "Twój kod potwierdzający Bookeep", heading: "Kod potwierdzający", body: "Wpisz ten kod, aby potwierdzić działanie:", button: "", ignore: "Jeśli nie prosiłeś o kod, zignoruj tę wiadomość." },
    de: { subject: "Dein Bookeep-Bestätigungscode", heading: "Bestätigungscode", body: "Gib diesen Code ein, um die Aktion zu bestätigen:", button: "", ignore: "Wenn du keinen Code angefordert hast, ignoriere diese E-Mail." },
    fr: { subject: "Votre code de confirmation Bookeep", heading: "Code de confirmation", body: "Saisissez ce code pour confirmer l’action :", button: "", ignore: "Si vous n’avez pas demandé de code, ignorez cet e-mail." },
    it: { subject: "Il tuo codice di conferma Bookeep", heading: "Codice di conferma", body: "Inserisci questo codice per confermare l’azione:", button: "", ignore: "Se non hai chiesto un codice, ignora questa e-mail." },
    es: { subject: "Tu código de confirmación de Bookeep", heading: "Código de confirmación", body: "Introduce este código para confirmar la acción:", button: "", ignore: "Si no pediste un código, ignora este correo." },
  },
};

const META: Record<MailLocale, { linkFallback: string; tagline: string; eyebrow: string }> = {
  en: { linkFallback: "If the button does not work, open this link:", tagline: "Adapted books in English and Finnish.", eyebrow: "Account" },
  fi: { linkFallback: "Jos painike ei toimi, avaa tämä linkki:", tagline: "Mukautettuja kirjoja englanniksi ja suomeksi.", eyebrow: "Tili" },
  uk: { linkFallback: "Якщо кнопка не працює, відкрийте це посилання:", tagline: "Адаптовані книги англійською та фінською.", eyebrow: "Акаунт" },
  ru: { linkFallback: "Если кнопка не работает, откройте эту ссылку:", tagline: "Адаптированные книги на английском и финском.", eyebrow: "Аккаунт" },
  pl: { linkFallback: "Jeśli przycisk nie działa, otwórz ten link:", tagline: "Adaptowane książki po angielsku i fińsku.", eyebrow: "Konto" },
  de: { linkFallback: "Falls der Button nicht funktioniert, öffne diesen Link:", tagline: "Vereinfachte Bücher auf Englisch und Finnisch.", eyebrow: "Konto" },
  fr: { linkFallback: "Si le bouton ne fonctionne pas, ouvrez ce lien :", tagline: "Livres adaptés en anglais et en finnois.", eyebrow: "Compte" },
  it: { linkFallback: "Se il pulsante non funziona, apri questo link:", tagline: "Libri adattati in inglese e finlandese.", eyebrow: "Account" },
  es: { linkFallback: "Si el botón no funciona, abre este enlace:", tagline: "Libros adaptados en inglés y finés.", eyebrow: "Cuenta" },
};

export type AuthMail = { subject: string; text: string; html: string };

/** Builds one auth email. `link` opens the confirmation; `code` is shown for reauthentication. */
export function authMail(kind: AuthMailKind, locale: MailLocale, link: string, code?: string): AuthMail {
  const copy = COPY[kind][locale];
  const meta = META[locale];
  const c = EMAIL_COLORS;

  const text = [
    copy.heading,
    '',
    copy.body,
    '',
    kind === 'reauthentication' ? (code ?? '') : link,
    '',
    copy.ignore,
    '',
    `Bookeep · ${meta.tagline}`,
    'https://bookeep.cloud',
  ].join('\n');

  const action =
    kind === 'reauthentication'
      ? `<p style="margin:24px 0 4px;font-family:'Courier New',monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:${c.accent};">${escapeHtml(code ?? '')}</p>`
      : `${emailButton(link, copy.button)}
              <p style="margin:18px 0 6px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${c.faint};">${escapeHtml(meta.linkFallback)}</p>
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${escapeHtml(link)}" target="_blank" style="color:${c.accentStrong};text-decoration:underline;">${escapeHtml(link)}</a></p>`;

  const html = renderEmail({
    lang: locale,
    preheader: copy.body,
    eyebrow: meta.eyebrow,
    heading: copy.heading,
    bodyHtml: `${paragraph(copy.body)}
              ${action}
              <div style="height:1px;background:${c.line};margin:28px 0 0;font-size:0;line-height:0;">&nbsp;</div>
              ${paragraph(copy.ignore, 'muted')}`,
    footer: meta.tagline,
  });

  return { subject: copy.subject, text, html };
}
