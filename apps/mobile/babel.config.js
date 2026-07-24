module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4: se engancha como preset (no plugin) y babel-preset-expo
    // necesita jsxImportSource apuntando a nativewind para transformar className.
    // El plugin de reanimated lo agrega babel-preset-expo automaticamente.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
