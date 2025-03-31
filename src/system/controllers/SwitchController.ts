export default async function SwitchController(req: ReqType, res: ResType) {
  const appId = req.query.appId as string;
  if (!appId) {
    res.status(400).send('Bad request, appId is required');
    return;
  }

  const secret = req.query.secret as string;
  if (!secret || secret !== process.env.SECRET) {
    res.status(403).send('Forbidden');
    return;
  }

  const app = req.appManager.appStorage.get(appId);
  if (!app) {
    res.status(404).send('App not found');
    return;
  }

  try {
    if (app.enable) {
      await app.appInstance._unmount();
      app.enable = false;
      // here will be db disabling

    } else {
      await app.appInstance._mount();
      app.appInstance.enabled = true;
      // here will be db enabling

    }
    res.status(200).send(`App ${appId} is now ${app.appInstance.enabled ? 'enabled' : 'disabled'}`);
    return;
  } catch (error) {
    res.status(500).send(`Error switching app: ${error.message}`);
    return;
  }
}

