<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

const $q = useQuasar();

const JSON_FILE_URL = 'src/pages/data.json';

const blockData = ref([]);
const tableConfig = ref([
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: '姓名', field: 'name', align: 'left', sortable: true },
  { name: 'age', label: '年齡', field: 'age', align: 'left', sortable: true },
]);
const tableButtons = ref([
  { label: '編輯', icon: 'edit', status: 'edit' },
  { label: '刪除', icon: 'delete', status: 'delete' },
]);
const tempData = ref({ name: '', age: '' });
const editData = ref({ id: 0, name: '', age: '' });
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const dataToDelete = ref(null);

// 分頁相關
const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 5,
  rowsNumber: 0,
});

// 篩選相關
const filter = ref('');

onMounted(async () => {
  await fetchData();
});

async function fetchData() {
  try {
    const localData = localStorage.getItem('myAppData');
    if (localData) {
      const parsedData = JSON.parse(localData);
      blockData.value = parsedData.blockData;
    } else {
      const response = await axios.get(JSON_FILE_URL);
      if (response.data && response.data.blockData) {
        blockData.value = response.data.blockData;
      }
    }
    updateRowsNumber();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    $q.notify({
      color: 'negative',
      message: '無法獲取數據',
      icon: 'report_problem'
    });
  }
}

async function saveData() {
  const data = {
    blockData: blockData.value,
  };

  try {
    localStorage.setItem('myAppData', JSON.stringify(data));
    await axios.put(JSON_FILE_URL, data);
    $q.notify({
      color: 'positive',
      message: '數據保存成功',
      icon: 'check_circle'
    });
  } catch (error) {
    console.error('Failed to save data:', error);
    $q.notify({
      color: 'negative',
      message: '數據保存失敗',
      icon: 'report_problem'
    });
  }
}

function handleClickOption(btn: any, data: any) {
  if (btn.status === 'edit') {
    openEditDialog(data);
  } else if (btn.status === 'delete') {
    openDeleteDialog(data);
  }
}

function addData() {
  if (!tempData.value.name || !tempData.value.age) {
    $q.notify({
      color: 'warning',
      message: '請填寫所有欄位',
      icon: 'warning'
    });
    return;
  }
  const newData = {
    id: Date.now(),
    name: tempData.value.name,
    age: parseInt(tempData.value.age),
  };
  blockData.value.push(newData);
  clearForm();
  saveData();
  updateRowsNumber();
  $q.notify({
    color: 'positive',
    message: '新增成功',
    icon: 'check_circle'
  });
}

function openEditDialog(data: any) {
  editData.value = JSON.parse(JSON.stringify(data));
  showEditDialog.value = true;
}

function confirmEditData() {
  if (!editData.value.name || !editData.value.age) {
    $q.notify({
      color: 'warning',
      message: '請填寫所有欄位',
      icon: 'warning'
    });
    return;
  }
  const index = blockData.value.findIndex(item => item.id === editData.value.id);
  if (index !== -1) {
    blockData.value[index] = { ...editData.value, age: parseInt(editData.value.age) };
    saveData();
    showEditDialog.value = false;
    updateRowsNumber();
    $q.notify({
      color: 'positive',
      message: '編輯成功',
      icon: 'check_circle'
    });
  } else {
    console.error('無法找到要編輯的項目');
    $q.notify({
      color: 'negative',
      message: '編輯失敗',
      icon: 'report_problem'
    });
  }
}

function openDeleteDialog(data: any) {
  dataToDelete.value = data;
  showDeleteDialog.value = true;
}

function confirmDeleteData() {
  const index = blockData.value.findIndex(item => item.id === dataToDelete.value.id);
  if (index !== -1) {
    blockData.value.splice(index, 1);
    saveData();
    showDeleteDialog.value = false;
    updateRowsNumber();
    $q.notify({
      color: 'positive',
      message: '刪除成功',
      icon: 'check_circle'
    });
  } else {
    $q.notify({
      color: 'negative',
      message: '刪除失敗',
      icon: 'report_problem'
    });
  }
}

function clearForm() {
  tempData.value.name = '';
  tempData.value.age = '';
}

function updateRowsNumber() {
  let data = [...blockData.value];
  if (filter.value) {
    const filt = filter.value.toLowerCase();
    data = data.filter(item =>
      item.name.toLowerCase().includes(filt) ||
      item.age.toString().includes(filt)
    );
  }
  pagination.value.rowsNumber = data.length;
}

// 計算屬性：根據篩選和分頁處理數據
const computedData = computed(() => {
  let data = [...blockData.value];

  // 應用篩選
  if (filter.value) {
    const filt = filter.value.toLowerCase();
    data = data.filter(item =>
      item.name.toLowerCase().includes(filt) ||
      item.age.toString().includes(filt)
    );
  }

  // 應用排序
  if (pagination.value.sortBy) {
    const sortFn = (a, b) => {
      const x = a[pagination.value.sortBy];
      const y = b[pagination.value.sortBy];
      if (x < y) return pagination.value.descending ? 1 : -1;
      if (x > y) return pagination.value.descending ? -1 : 1;
      return 0;
    };
    data.sort(sortFn);
  }

  // 應用分頁
  const startRow = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const endRow = startRow + pagination.value.rowsPerPage;
  return data.slice(startRow, endRow);
});

// 處理分頁和排序變更
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value = { ...pagination.value, page, rowsPerPage, sortBy, descending };
  updateRowsNumber();
}

// 監聽篩選器變化
watch(filter, () => {
  pagination.value.page = 1;
  updateRowsNumber();
});
</script>

<template>
  <q-page class="q-pa-md">
    <q-card class="my-card q-mb-md">
      <q-card-section>
        <div class="text-h6">新增資料</div>
        <q-input v-model="tempData.name" label="姓名" class="q-mb-sm" />
        <q-input v-model="tempData.age" label="年齡" type="number" class="q-mb-sm" />
        <q-btn color="primary" @click="addData" icon="add">新增</q-btn>
      </q-card-section>
    </q-card>

    <q-card class="my-card">
      <q-card-section>
        <div class="text-h6">資料列表</div>
        <q-table
          :rows="computedData"
          :columns="tableConfig"
          row-key="id"
          :pagination="pagination"
          :filter="filter"
          @request="onRequest"
        >
          <template v-slot:top-right>
            <q-input dense debounce="300" v-model="filter" placeholder="搜尋">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" auto-width>
              <q-btn-group spread flat>
                <q-btn color="primary" icon="edit" @click="handleClickOption({status: 'edit'}, props.row)" />
                <q-btn color="negative" icon="delete" @click="handleClickOption({status: 'delete'}, props.row)" />
              </q-btn-group>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">編輯資料</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="editData.name" label="姓名" class="q-mb-sm" />
          <q-input v-model="editData.age" label="年齡" type="number" class="q-mb-sm" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="確認" color="primary" @click="confirmEditData" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">確認刪除</div>
        </q-card-section>
        <q-card-section>
          你確定要刪除這條資料嗎？
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="確認" color="negative" @click="confirmDeleteData" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.my-card {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
</style>
