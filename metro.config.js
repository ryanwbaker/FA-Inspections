const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// React Native 0.81 nests @react-native/virtualized-lists, which depends on
// invariant and nullthrows. These live at the root node_modules but Metro's
// resolver can't find them from the nested path without explicit guidance.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  invariant: path.resolve(__dirname, 'node_modules/invariant'),
  nullthrows: path.resolve(__dirname, 'node_modules/nullthrows'),
}

module.exports = config
