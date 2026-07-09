function poiAttrFoodGroups(pilot) {
  const attrPois = [];
  const foodPois = [];
  for (let i = 0; i < pilot.matrix_ids.length; i++) {
    const id = pilot.matrix_ids[i];
    const poi = pilot.pois[i];
    if (id.includes('-ATR')) attrPois.push(poi);
    else if (id.includes('-FOOD')) foodPois.push(poi);
  }
  return { attrPois, foodPois };
}

module.exports = { poiAttrFoodGroups };
