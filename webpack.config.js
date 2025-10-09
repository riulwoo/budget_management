const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: isProduction ? '[name].[contenthash].js' : 'bundle.js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      publicPath: '/',
      clean: true
    },
    // 코드 스플리팅 최적화
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      runtimeChunk: 'single',
      usedExports: true,
      sideEffects: false,
    },
    // 성능 경고 설정 조정
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 500000,
      maxAssetSize: 300000,
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
          {
            loader: 'style-loader',
            options: {
              injectType: 'singletonStyleTag', // 하나의 style 태그에 모든 CSS 주입
              attributes: {
                id: 'budget-app-styles'
              }
            }
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true, // 소스맵 활성화
              importLoaders: 1
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
}; 