import proj4 from "proj4";

const firstProjection =
    "+proj=lcc +lat_0=47 +lon_0=-120.833333333333 +lat_1=48.7333333333333 +lat_2=47.5 +x_0=500000.0001016 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +vunits=us-ft +no_defs +type=crs";
const osmProjection = "+proj=longlat +datum=WGS84 +no_defs +type=crs";

export const convertToOSM = (x, y) => {
    return proj4(firstProjection, osmProjection, [x, y]);
};

export const convertFromOSM = (x, y) => {
    return proj4(osmProjection, firstProjection, [x, y]);
};
