// site/app/api/steam/profile/route.js
// API que busca informações do perfil Steam

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get('steamId');

  if (!steamId) {
    return Response.json({ error: 'steamId é obrigatório' }, { status: 400 });
  }

  try {
    // Resolve vanity URL (nome customizado) para Steam64
    let steam64 = steamId;
    if (!/^\d{17}$/.test(steamId)) {
      const vanityRes = await fetch(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API_KEY}&vanityurl=${steamId}`
      );
      const vanityData = await vanityRes.json();
      if (vanityData?.response?.success === 1) {
        steam64 = vanityData.response.steamid;
      } else {
        return Response.json({ error: 'Perfil Steam não encontrado' }, { status: 404 });
      }
    }

    // Busca informações do perfil
    const profileRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steam64}`
    );
    const profileData = await profileRes.json();
    const player = profileData?.response?.players?.[0];

    if (!player) {
      return Response.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    return Response.json({
      steam64,
      personaname: player.personaname,
      avatarfull: player.avatarfull,
      profileurl: player.profileurl,
      communityvisibilitystate: player.communityvisibilitystate,
    });
  } catch (error) {
    return Response.json({ error: 'Erro ao buscar perfil Steam' }, { status: 500 });
  }
}
