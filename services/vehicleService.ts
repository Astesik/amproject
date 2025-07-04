// services/vehicleService.ts

const API = 'http://192.168.50.105:8080';

export async function getGroups() {
  try {
    const res = await fetch(`${API}/api/vehicle-groups`);
    const data = await res.json();
    return [
      { label: 'Wszystkie pojazdy', value: 'all' },
      { label: 'Ciągniki', value: 'trucks' },
      { label: 'Naczepy', value: 'trailers' },
      ...data.map((g: any) => ({ label: g.name, value: `group:${g.id}` })),
    ];
  } catch {
    return [
      { label: 'Wszystkie pojazdy', value: 'all' },
      { label: 'Ciągniki', value: 'trucks' },
      { label: 'Naczepy', value: 'trailers' },
    ];
  }
}

export async function getVehicles(group: string) {
  let url = `${API}/api/positions/get`;
  if (group === 'trucks') url = `${API}/api/positions/trucks`;
  else if (group === 'trailers') url = `${API}/api/positions/trailers`;
  else if (group.startsWith('group:')) url = `${API}/api/positions/group/${group.split(':')[1]}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
