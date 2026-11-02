import { escapeHtml } from './email.js';

export type MailLocale = 'en' | 'fi' | 'uk' | 'ru';
export type AuthMailKind = 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change' | 'reauthentication';

export function resolveMailLocale(value?: unknown): MailLocale {
  const raw = typeof value === 'string' ? value.toLowerCase().slice(0, 2) : '';
  if (raw === 'fi' || raw === 'uk' || raw === 'ru') return raw;
  if (raw === 'ua') return 'uk';
  return 'en';
}

type Copy = { subject: string; heading: string; body: string; button: string; ignore: string };

const COPY: Record<AuthMailKind, Record<MailLocale, Copy>> = {
  signup: {
    en: {
      subject: 'Confirm your Bookeep account',
      heading: 'Welcome to Bookeep',
      body: 'Confirm your email to finish creating your account and start reading.',
      button: 'Confirm email',
      ignore: 'If you did not sign up for Bookeep, just ignore this email.',
    },
    fi: {
      subject: 'Vahvista Bookeep-tilisi',
      heading: 'Tervetuloa Bookeepiin',
      body: 'Vahvista sähköpostiosoitteesi, niin tilisi on valmis ja voit aloittaa lukemisen.',
      button: 'Vahvista sähköposti',
      ignore: 'Jos et rekisteröitynyt Bookeepiin, voit jättää tämän viestin huomiotta.',
    },
    uk: {
      subject: 'Підтвердіть акаунт Bookeep',
      heading: 'Вітаємо в Bookeep',
      body: 'Підтвердіть пошту, щоб завершити реєстрацію та почати читати.',
      button: 'Підтвердити пошту',
      ignore: 'Якщо ви не реєструвалися в Bookeep, просто проігноруйте цей лист.',
    },
    ru: {
      subject: 'Подтвердите аккаунт Bookeep',
      heading: 'Добро пожаловать в Bookeep',
      body: 'Подтвердите почту, чтобы завершить регистрацию и начать читать.',
      button: 'Подтвердить почту',
      ignore: 'Если вы не регистрировались в Bookeep, просто проигнорируйте это письмо.',
    },
  },
  recovery: {
    en: {
      subject: 'Reset your Bookeep password',
      heading: 'Reset your password',
      body: 'We received a request to reset your password. The link works for one hour.',
      button: 'Set a new password',
      ignore: 'If you did not ask for this, ignore this email. Your password stays the same.',
    },
    fi: {
      subject: 'Nollaa Bookeep-salasanasi',
      heading: 'Salasanan nollaus',
      body: 'Saimme pyynnön nollata salasanasi. Linkki toimii tunnin ajan.',
      button: 'Aseta uusi salasana',
      ignore: 'Jos et pyytänyt tätä, jätä viesti huomiotta. Salasanasi pysyy ennallaan.',
    },
    uk: {
      subject: 'Скидання пароля Bookeep',
      heading: 'Скидання пароля',
      body: 'Ми отримали запит на скидання пароля. Посилання діє одну годину.',
      button: 'Задати новий пароль',
      ignore: 'Якщо ви цього не робили, проігноруйте лист. Пароль залишиться тим самим.',
    },
    ru: {
      subject: 'Сброс пароля Bookeep',
      heading: 'Сброс пароля',
      body: 'Мы получили запрос на сброс пароля. Ссылка действует один час.',
      button: 'Задать новый пароль',
      ignore: 'Если вы этого не делали, проигнорируйте письмо. Пароль останется прежним.',
    },
  },
  magiclink: {
    en: {
      subject: 'Your Bookeep sign-in link',
      heading: 'Sign in to Bookeep',
      body: 'Use the button below to sign in. The link works once.',
      button: 'Sign in',
      ignore: 'If you did not ask to sign in, ignore this email.',
    },
    fi: {
      subject: 'Bookeep-kirjautumislinkkisi',
      heading: 'Kirjaudu Bookeepiin',
      body: 'Kirjaudu sisään alla olevasta painikkeesta. Linkki toimii kerran.',
      button: 'Kirjaudu',
      ignore: 'Jos et pyytänyt kirjautumista, jätä viesti huomiotta.',
    },
    uk: {
      subject: 'Посилання для входу в Bookeep',
      heading: 'Вхід у Bookeep',
      body: 'Натисніть кнопку нижче, щоб увійти. Посилання одноразове.',
      button: 'Увійти',
      ignore: 'Якщо ви не намагалися увійти, проігноруйте цей лист.',
    },
    ru: {
      subject: 'Ссылка для входа в Bookeep',
      heading: 'Вход в Bookeep',
      body: 'Нажмите кнопку ниже, чтобы войти. Ссылка одноразовая.',
      button: 'Войти',
      ignore: 'Если вы не пытались войти, проигнорируйте это письмо.',
    },
  },
  invite: {
    en: {
      subject: 'You are invited to Bookeep',
      heading: 'You are invited to Bookeep',
      body: 'Accept the invitation to create your account.',
      button: 'Accept invitation',
      ignore: 'If you were not expecting this, ignore this email.',
    },
    fi: {
      subject: 'Sinut on kutsuttu Bookeepiin',
      heading: 'Kutsu Bookeepiin',
      body: 'Hyväksy kutsu luodaksesi tilin.',
      button: 'Hyväksy kutsu',
      ignore: 'Jos et odottanut tätä, jätä viesti huomiotta.',
    },
    uk: {
      subject: 'Запрошення до Bookeep',
      heading: 'Запрошення до Bookeep',
      body: 'Прийміть запрошення, щоб створити акаунт.',
      button: 'Прийняти запрошення',
      ignore: 'Якщо ви на це не чекали, проігноруйте лист.',
    },
    ru: {
      subject: 'Приглашение в Bookeep',
      heading: 'Приглашение в Bookeep',
      body: 'Примите приглашение, чтобы создать аккаунт.',
      button: 'Принять приглашение',
      ignore: 'Если вы этого не ждали, проигнорируйте письмо.',
    },
  },
  email_change: {
    en: {
      subject: 'Confirm your new Bookeep email',
      heading: 'Confirm the email change',
      body: 'Confirm that this address should be used for your Bookeep account.',
      button: 'Confirm change',
      ignore: 'If you did not ask to change your email, ignore this email.',
    },
    fi: {
      subject: 'Vahvista uusi Bookeep-sähköpostisi',
      heading: 'Vahvista sähköpostin vaihto',
      body: 'Vahvista, että tätä osoitetta käytetään Bookeep-tililläsi.',
      button: 'Vahvista vaihto',
      ignore: 'Jos et pyytänyt vaihtoa, jätä viesti huomiotta.',
    },
    uk: {
      subject: 'Підтвердіть нову пошту Bookeep',
      heading: 'Підтвердіть зміну пошти',
      body: 'Підтвердіть, що ця адреса має використовуватися для вашого акаунта Bookeep.',
      button: 'Підтвердити зміну',
      ignore: 'Якщо ви не змінювали пошту, проігноруйте лист.',
    },
    ru: {
      subject: 'Подтвердите новую почту Bookeep',
      heading: 'Подтвердите смену почты',
      body: 'Подтвердите, что этот адрес будет использоваться для вашего аккаунта Bookeep.',
      button: 'Подтвердить смену',
      ignore: 'Если вы не меняли почту, проигнорируйте письмо.',
    },
  },
  reauthentication: {
    en: {
      subject: 'Your Bookeep confirmation code',
      heading: 'Confirmation code',
      body: 'Enter this code to confirm the action:',
      button: '',
      ignore: 'If you did not ask for a code, ignore this email.',
    },
    fi: {
      subject: 'Bookeep-vahvistuskoodisi',
      heading: 'Vahvistuskoodi',
      body: 'Syötä tämä koodi vahvistaaksesi toiminnon:',
      button: '',
      ignore: 'Jos et pyytänyt koodia, jätä viesti huomiotta.',
    },
    uk: {
      subject: 'Код підтвердження Bookeep',
      heading: 'Код підтвердження',
      body: 'Введіть цей код, щоб підтвердити дію:',
      button: '',
      ignore: 'Якщо ви не запитували код, проігноруйте лист.',
    },
    ru: {
      subject: 'Код подтверждения Bookeep',
      heading: 'Код подтверждения',
      body: 'Введите этот код, чтобы подтвердить действие:',
      button: '',
      ignore: 'Если вы не запрашивали код, проигнорируйте письмо.',
    },
  },
};

const LINK_FALLBACK: Record<MailLocale, string> = {
  en: 'If the button does not work, open this link:',
  fi: 'Jos painike ei toimi, avaa tämä linkki:',
  uk: 'Якщо кнопка не працює, відкрийте це посилання:',
  ru: 'Если кнопка не работает, откройте эту ссылку:',
};

export type AuthMail = { subject: string; text: string; html: string };

/** Builds one auth email. `link` opens the confirmation; `code` is shown for reauthentication. */
export function authMail(kind: AuthMailKind, locale: MailLocale, link: string, code?: string): AuthMail {
  const copy = COPY[kind][locale];
  const text = [
    copy.heading,
    '',
    copy.body,
    '',
    kind === 'reauthentication' ? (code ?? '') : link,
    '',
    copy.ignore,
    '',
    '— Bookeep · bookeep.cloud',
  ].join('\n');

  const action =
    kind === 'reauthentication'
      ? `<p style="margin:24px 0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f2a1f;">${escapeHtml(code ?? '')}</p>`
      : `<p style="margin:28px 0;">
          <a href="${escapeHtml(link)}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#7fd6b0;color:#0b1f17;font-weight:700;text-decoration:none;">${escapeHtml(copy.button)}</a>
        </p>
        <p style="margin:0 0 6px;font-size:13px;color:#5b6b63;">${escapeHtml(LINK_FALLBACK[locale])}</p>
        <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${escapeHtml(link)}" style="color:#2f7a5a;">${escapeHtml(link)}</a></p>`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<body style="margin:0;padding:24px;background:#0f2a1f;font-family:Georgia,'Times New Roman',serif;color:#1c2b24;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 16px;color:#a7e3c8;font-size:20px;font-weight:700;letter-spacing:0.5px;">Bookeep</p>
    <div style="padding:32px;background:#f7f5ee;border-radius:20px;">
      <h1 style="margin:0 0 12px;font-size:24px;color:#0f2a1f;">${escapeHtml(copy.heading)}</h1>
      <p style="margin:0;font-size:16px;line-height:1.55;">${escapeHtml(copy.body)}</p>
      ${action}
      <p style="margin:28px 0 0;font-size:13px;color:#5b6b63;">${escapeHtml(copy.ignore)}</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#8fbfa8;">bookeep.cloud</p>
  </div>
</body>
</html>`;

  return { subject: copy.subject, text, html };
}
