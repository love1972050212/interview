import axios from 'axios';

const JSON_FILE_URL = 'src/pages/data.json';  // 假設 JSON 檔案位於根目錄下或是靜態資源目錄下

// 讀取 JSON 檔案的資料
async function fetchData() {
  try {
    const response = await axios.get(JSON_FILE_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}

// 保存修改後的 JSON 檔案
async function saveData(data:any) {
  try {
    await axios.put(JSON_FILE_URL, data);
    console.log('Data saved successfully.');
  } catch (error) {
    console.error('Failed to save data:', error);
  }
}

export { fetchData, saveData };
