import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify } from 'vuetify'

export default createVuetify({
  defaults: {
    VBtn: {
      class: 'text-uppercase',
    },
  },
  display: {
    thresholds: {
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },
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
          primary: '#334155',
          secondary: '#595D65',
          error: '#D32F2F',
          background: '#F6F7F9',
          surface: '#FFFFFF',
        },
      },
    },
  },
})
