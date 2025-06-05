export function getTodayChain() {
  const today = new Date().toISOString().split('T')[0];
  const targets = {
    '2025-05-31': ['The_Boat_Race_2018', 'Melon'],
    '2025-06-01': ['Pac-Man', 'Cucumber', 'Mammal'],
    '2025-06-02': ['Basketball', 'Milwaukee', 'Arcade_cabinet', ],
    '2025-06-03': ['LOL', 'Television', 'Time_zone', ],
    '2025-06-04': ['Diamond_Life', 'School', 'Wallet'],
    '2025-06-05': ['Pizza_farm', 'Earth', 'Buffalo_wing'],
    '2025-06-06': ['Chill_Guy', 'Friday', 'Team'],
    '2025-06-07': ['Tornadoes_in_Chicago', 'Temperature', 'Italy'],
    '2025-06-08': ['Battle_of_Diamond_Rock', 'Rock_and_roll', 'Bread_roll'],
    '2025-06-09': ['The_X-Files', 'WWE', 'Saturn'],
    '2025-06-10': ['Christina\'s_World', 'T-shirt', 'Blood'],
    '2025-06-11': ['Strahd_von_Zarovich', 'Dust', 'Car'],
    '2025-06-12': ['Dolly_Gray_impostor', 'University', 'Football'],
    '2025-06-13': ['', '', ''],
    '2025-06-14': ['', '', ''],
    '2025-06-15': ['', '', ''],
    '2025-06-16': ['', '', ''],
    '2025-06-17': ['', '', ''],
    '2025-06-18': ['', '', ''],
    '2025-06-19': ['', '', ''],
  };
  return targets[today] || ['Wikipedia', 'Sorry'];
}
