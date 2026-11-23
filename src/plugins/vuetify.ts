import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify } from 'vuetify'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1565C0',
          secondary: '#595D65',
          error: '#D32F2F',
          background: '#F6F7F9',
          surface: '#FFFFFF',
        },
      },
    },
  },
})
