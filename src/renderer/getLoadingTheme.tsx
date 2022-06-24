export function getLoadingTheme() {
  const darkLoadingStyle = {
    text: '载入中...',
    textColor: '#FFF',
    maskColor: 'rgb(24 24 27)',
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'sans-serif',
  };
  const lightLoadingStyle = {
    text: '载入中...',
    maskColor: '#FFF',
    textColor: 'rgb(24 24 27)',
    zlevel: 0,
    fontSize: 12,
    showSpinner: true,
    spinnerRadius: 10,
    lineWidth: 5,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'sans-serif',
  };
  let loadingTheme = lightLoadingStyle;
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    loadingTheme = darkLoadingStyle;
  }
  return loadingTheme;
}
