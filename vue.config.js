module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  devServer: {
    proxy: {
      '/': {
        target: process.env.VUE_APP_BASE_URL,
        pathRewrite: {
          '^/': '/'
        },
        changeOrigin: true
      }
    }
  },
};
