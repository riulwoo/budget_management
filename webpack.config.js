const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true // 빌드 전에 output 디렉토리를 정리
  },
  cache: {
    type: 'filesystem', // 파일시스템 기반 캐시
    buildDependencies: {
      config: [__filename] // 설정 파일이 변경되면 캐시 무효화
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true, // 소스맵 활성화
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3001,
    hot: true, // 핫 모듈 교체
    liveReload: true, // 라이브 리로드
    watchFiles: ['src/**/*.css', 'src/**/*.js'], // 파일 변경 감지
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
}; 