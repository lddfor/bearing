import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 NU1006.json 文件
const nu1006Path = path.join(__dirname, 'NU1006.json');
const nu1006Data = JSON.parse(await fs.readFile(nu1006Path, 'utf8'));

// 为每个数据集添加平均值
for (const key in nu1006Data) {
  if (nu1006Data.hasOwnProperty(key)) {
    const dataSet = nu1006Data[key];
    if (Array.isArray(dataSet)) {
      // 计算平均值
      const average = {
        id: "平均值",
        rsUntreated: 0,
        rsIonImplantation: 0,
        rsElectromagneticCoupling: 0,
        lsUntreated: 0,
        lsIonImplantation: 0,
        lsElectromagneticCoupling: 0,
        zUntreated: 0,
        zIonImplantation: 0,
        zElectromagneticCoupling: 0
      };
      
      // 计算总和
      dataSet.forEach(item => {
        average.rsUntreated += item.rsUntreated;
        average.rsIonImplantation += item.rsIonImplantation;
        average.rsElectromagneticCoupling += item.rsElectromagneticCoupling;
        average.lsUntreated += item.lsUntreated;
        average.lsIonImplantation += item.lsIonImplantation;
        average.lsElectromagneticCoupling += item.lsElectromagneticCoupling;
        average.zUntreated += item.zUntreated;
        average.zIonImplantation += item.zIonImplantation;
        average.zElectromagneticCoupling += item.zElectromagneticCoupling;
      });
      
      // 计算平均值
      const count = dataSet.length;
      average.rsUntreated = parseFloat((average.rsUntreated / count).toFixed(3));
      average.rsIonImplantation = parseFloat((average.rsIonImplantation / count).toFixed(3));
      average.rsElectromagneticCoupling = parseFloat((average.rsElectromagneticCoupling / count).toFixed(3));
      average.lsUntreated = parseFloat((average.lsUntreated / count).toFixed(5));
      average.lsIonImplantation = parseFloat((average.lsIonImplantation / count).toFixed(5));
      average.lsElectromagneticCoupling = parseFloat((average.lsElectromagneticCoupling / count).toFixed(5));
      average.zUntreated = parseFloat((average.zUntreated / count).toFixed(4));
      average.zIonImplantation = parseFloat((average.zIonImplantation / count).toFixed(4));
      average.zElectromagneticCoupling = parseFloat((average.zElectromagneticCoupling / count).toFixed(4));
      
      // 添加平均值到数据集
      dataSet.push(average);
    }
  }
}

// 写回文件
await fs.writeFile(nu1006Path, JSON.stringify(nu1006Data, null, 2));
console.log('已为 NU1006.json 添加平均值数据');
