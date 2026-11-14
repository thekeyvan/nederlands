// The resource collection moved into the app. Keep #week links pointing at the weekly plan.
location.replace(`./${location.hash === '#week' ? '#week' : '#bronnen'}`);
