import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

// Country audience data structure
interface CountryData {
  country: string;
  code: string;
  audience: number;
  percentage: number;
}

interface WorldMapProps {
  title?: string;
  countries: CountryData[];
  totalAudience?: number;
  dateRange?: string;
}

export default function WorldMap({ 
  title = "Audience by Country",
  countries = [],
  totalAudience = 0,
  dateRange = "Last 30 days"
}: WorldMapProps) {
  const { t } = useTranslation();
  
  // Function to determine how intense the color should be based on percentage
  const getIntensity = (percentage: number) => {
    if (percentage > 20) return 'bg-blue-800';
    if (percentage > 15) return 'bg-blue-700';
    if (percentage > 10) return 'bg-blue-600';
    if (percentage > 5) return 'bg-blue-500';
    if (percentage > 2) return 'bg-blue-400';
    return 'bg-blue-300';
  };
  
  // Get country flag
  const getCountryFlag = (code: string) => {
    return `https://flagcdn.com/16x12/${code.toLowerCase()}.png`;
  };
  
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">{title}</h2>
          
          <Select defaultValue={dateRange}>
            <SelectTrigger className="w-[180px] text-sm border border-neutral-100 rounded-lg">
              <SelectValue placeholder={dateRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={dateRange}>{dateRange}</SelectItem>
              <SelectItem value="Last 7 days">Last 7 days</SelectItem>
              <SelectItem value="Last 90 days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mb-6">
          <div className="font-medium text-3xl mb-1">{totalAudience.toLocaleString()}</div>
          <div className="text-sm text-gray-500">{t('dashboard.totalAudience')}</div>
        </div>
        
        {/* Simple world map visualization - this is a placeholder */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 relative overflow-hidden h-[200px] flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            {/* This is a simplified world map path */}
            <path 
              d="M156,154 L156,154 L159,158 L159,162 L156,165 L153,167 L150,169 L149,172 L154,174 L158,176 L161,178 L162,183 L164,184 L165,182 L168,183 L170,183 L170,187 L174,187 L176,187 L178,185 L180,187 L180,190 L183,191 L185,191 L187,189 L190,191 L193,195 L192,198 L193,201 L193,204 L196,204 L198,207 L200,208 L201,212 L201,215 L203,216 L206,216 L208,216 L210,219 L210,222 L213,223 L215,224 L217,225 L219,227 L221,229 L223,231 L225,233 L227,233 L229,233 L231,231 L232,229 L234,228 L236,227 L238,227 L240,228 L241,230 L243,230 L245,232 L247,234 L249,234 L251,234 L253,235 L255,236 L257,237 L259,238 L260,240 L262,242 L264,243 L266,244 L268,245 L270,247 L271,249 L273,250 L275,251 L277,253 L279,253 L281,255 L283,256 L285,257 L287,258 L289,259 L291,260 L293,261 L295,262 L297,263 L299,264 L301,264 L303,265 L305,266 L307,267 L309,267 L311,268 L312,270 L314,271 L316,272 L318,273 L320,273 L322,273 L324,272 L326,271 L328,270 L330,270 L332,271 L334,271 L336,271 L338,270 L339,269 L341,268 L343,268 L345,268 L347,269 L349,270 L351,271 L353,271 L355,271 L357,270 L358,268 L360,267 L362,267 L364,267 L366,268 L368,270 L370,270 L372,270 L374,271 L376,271 L378,270 L380,269 L382,270 L384,270 L386,269 L388,269 L390,268 L392,267 L394,266 L396,265 L398,264 L400,264 L402,264 L404,264 L406,264 L408,265 L410,265 L412,264 L414,264 L416,264 L418,263 L420,263 L422,262 L424,262 L426,262 L428,263 L430,263 L432,263 L434,262 L436,261 L438,260 L440,260 L441,259 L443,258 L445,257 L447,256 L449,255 L451,254 L453,253 L455,253 L457,253 L459,253 L461,253 L463,253 L465,253 L467,252 L469,251 L471,250 L473,249 L475,249 L477,249 L479,249 L481,248 L483,247 L485,246 L487,245 L489,244 L491,244 L493,244 L495,243 L497,243 L499,243 L501,243 L503,243 L505,243 L507,243 L509,243 L511,243 L513,243 L515,243 L517,243 L519,242 L521,241 L523,241 L525,241 L527,240 L529,239 L531,239 L533,239 L535,239 L537,240 L539,240 L541,240 L543,241 L545,241 L547,241 L549,240 L551,239 L553,238 L555,237 L557,237 L559,236 L561,236 L563,236 L565,235 L567,235 L569,235 L571,235 L573,235 L575,235 L577,235 L579,235 L581,235 L583,234 L585,234 L587,234 L589,233 L591,233 L593,232 L595,231 L597,230 L599,230 L601,230 L603,229 L605,229 L607,229 L609,229 L611,229 L613,229 L615,229 L617,229 L619,229 L621,228 L623,228 L625,228 L627,227 L629,226 L631,225 L633,225 L635,225 L637,224 L639,223 L641,223 L643,223 L645,223 L647,223 L649,222 L651,222 L653,222 L655,222 L657,222 L659,222 L661,222 L663,222 L665,221 L667,221 L669,221 L671,220 L673,219 L675,219 L677,219 L679,219 L681,219 L683,219 L685,219 L687,218 L689,218 L691,217 L693,217 L695,217 L697,217 L699,217 L701,217 L703,217 L705,217 L707,217 L709,217 L711,216 L713,216 L715,215 L717,215 L719,214 L721,213 L723,212 L725,211 L727,211 L729,211 L731,211 L733,210 L735,210 L737,209 L739,209 L741,208 L743,208 L745,207 L747,207 L749,207 L751,207 L753,207 L755,207 L757,207 L759,207 L761,207 L763,207 L765,207 L767,207 L769,207 L771,207 L773,207 L775,207 L777,206 L779,206 L781,205 L783,205 L785,204 L787,204 L789,204 L791,203 L793,203 L795,203 L797,203 L799,202 L801,202 L803,202 L805,202 L807,201 L809,201 L811,201 L813,201 L815,201 L817,200 L819,200 L821,200 L823,200 L825,200 L827,200 L829,199 L831,199 L833,199 L835,199 L837,198 L839,198 L841,198 L843,197 L845,197 L847,196 L849,196 L851,196 L853,195 L855,195 L857,195 L859,195 L861,195 L863,195 L865,195 L867,195 L869,194 L871,194 L873,194 L875,194 L877,194 L879,194 L881,194 L883,194 L885,194 L887,194 L889,194 L891,193 L893,193 L895,193 L897,193 L899,193 L901,193 L903,193 L905,193 L907,193 L909,193 L911,193 L913,193 L915,193 L917,193 L919,192 L921,192 L923,192 L925,192 L927,191 L929,191 L931,191 L933,191 L935,191 L937,191 L939,191 L941,191 L943,191 L945,191 L947,191 L949,191 L951,191 L953,191 L955,191 L957,191 L959,191 L961,191 L963,190 L965,190 L967,190 L969,190 L971,190 L973,190 L975,189 L977,189 L979,189 L981,189 L983,189 L985,189 L987,189 L989,189 L991,189 L993,189 L995,188 L997,188 L999,188 L1001,188 L1003,188 L1005,188 L1007,188 L1009,188 L1011,188 L1013,188 L1015,188 L1017,188 L1019,188 L1021,188 L1023,188 L1025,188 L1027,188 L1029,188 L1031,188 L1033,188 L1035,188 L1037,188 L1039,188 L1041,188 L1043,188 L1045,188 L1047,188 L1049,188 L1051,188 L1053,188 L1055,188 L1057,188 L1059,188 L1061,189 L1063,189 L1065,189 L1067,189 L1069,189 L1071,189 L1073,189 L1075,189 L1077,189 L1079,189 L1081,189 L1083,189 L1085,189 L1087,189 L1089,189 L1091,189 L1093,189 L1095,189 L1097,189 L1099,189 L1101,189 L1103,189 L1105,189 L1107,189 L1109,189 L1111,189 L1113,189 L1115,189 L1117,189 L1119,189 L1121,189 L1123,189 L1125,189 L1127,189 L1129,189 L1131,189 L1133,189 L1135,189 L1137,189 L1139,189 L1141,189 L1143,189 L1145,190 L1147,190 L1149,190 L1151,190 L1153,190 L1155,190 L1157,190 L1159,190 L1161,190 L1163,190 L1165,190 L1167,190 L1169,190 L1171,190 L1173,190 L1175,190 L1177,190 L1179,190 L1181,190 L1183,190 L1185,190 L1187,190 L1189,190 L1191,190 L1193,190 L1195,190 L1197,190 L1199,190 L1201,190 L1203,190 L1205,190 L1207,190 L1209,190 L1211,190 L1213,190 L1215,190 L1217,190 L1219,190 L1221,190 L1223,190 L1225,190 L1227,190 L1229,190 L1231,190 L1233,190 L1235,190 L1237,190 L1239,190 L1241,190 L1243,190 L1245,190 L1247,190 L1249,190 L1251,190 L1253,190 L1255,190 L1257,190 L1259,190 L1261,190 L1263,190 L1265,190 L1267,190 L1269,190 L1271,190 L1273,190 L1275,190 L1277,190 L1279,190 L1281,190 L1283,190 L1285,190 L1287,190 L1289,190 L1291,190 L1293,190 L1295,190 L1297,190 L1299,190 L1301,190 L1303,190 L1305,190 L1307,190 L1309,190 L1311,190 L1313,190 L1315,190 L1317,190 L1319,190 L1321,190 L1323,190 L1325,190 L1327,190 L1329,190 L1331,190 L1333,190 L1335,190 L1337,190 L1339,190 L1341,190 L1343,190 L1345,190 L1347,190 L1349,190 L1351,190 L1353,190 L1355,190 L1357,190 L1359,190 L1361,190 L1363,190 L1365,190 L1367,190 L1369,190"
              fill="none"
              stroke="#D1DEFA"
              strokeWidth="1"
            />
            
            {/* Add colored regions based on audience */}
            {countries.map((country, index) => (
              <circle 
                key={country.code}
                cx={150 + (index * 50) % 800} // These are placeholder positions
                cy={150 + Math.floor((index * 50) / 800) * 50}
                r={15 + (country.percentage/2)}
                className={`${getIntensity(country.percentage)} opacity-60`}
              />
            ))}
          </svg>
          
          <div className="absolute bottom-4 left-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-800 mr-2"></div>
              <span>High presence</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
              <span>Medium presence</span>
            </div>
          </div>
        </div>
        
        {/* Top countries list */}
        <div>
          <div className="mb-2 text-sm text-gray-500 font-medium">{t('dashboard.topCountries')}</div>
          <div className="space-y-2">
            {countries.map((country, index) => (
              <motion.div 
                key={country.code}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-2">
                    <img src={getCountryFlag(country.code)} alt={country.country} className="w-full h-auto" />
                  </div>
                  <span>{country.country}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3 font-medium">{country.audience.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{country.percentage}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}