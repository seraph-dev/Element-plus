## Calendar

日付を表示します。

### 基本的なこと

:::demo 現在表示されている月を指定するために `value` を設定する。`value` が指定されない場合は現在の月を表示する。`value` は双方向のバインディングをサポートする。

```html
<el-calendar v-model="value"> </el-calendar>

<script>
  export default {
    data() {
      return {
        value: new Date(),
      }
    },
  }
</script>
<!--
<setup>

  import { defineComponent, ref } from 'vue';

  export default defineComponent({
    setup() {
      const value = ref(new Date());

      return {
        value,
      };
    },
  });

</setup>
-->
```

:::

### カスタムコンテンツ

:::demo `scoped-slot` に `dateCell` という名前を設定することで、calendar セルに表示する内容をカスタマイズすることができる。`scoped-slot`では、日付(現在のセルの日付)とデータ(type, isSelected, day 属性を含む)を取得することができます。詳細は以下の API ドキュメントを参照のこと。

```html
<el-calendar>
  <template #dateCell="{data}">
    <p :class="data.isSelected ? 'is-selected' : ''">
      {{ data.day.split('-').slice(1).join('-') }} {{ data.isSelected ? '✔️' :
      ''}}
    </p>
  </template>
</el-calendar>
<style>
  .is-selected {
    color: #1989fa;
  }
</style>
```

:::

### レンジ

:::demo calendar の表示範囲を指定するために `range` 属性を設定する。開始時刻は月曜日、終了時刻は日曜日でなければならず、期間は 2 ヶ月を超えてはならない。

```html
<el-calendar :range="['2019-03-04', '2019-03-24']"> </el-calendar>
```

:::

### カスタムヘッド

:::demo という名前を設定することで `header` に `scoped-slot` カレンダーヘッダーに表示されるコンテンツをカスタマイズします。 存在 `scoped-slot` 日付（現在のセルの日付）を取得できます。 詳細については、以下の API ドキュメントを参照してください。

```html
<el-calendar ref="calendar">
  <template #header="{date}">
    <span>カスタムヘッダーコンテンツ</span>
    <span>{{ date }}</span>
    <el-button-group>
      <el-button size="mini" @click="selectDate('prev-year')">上一年</el-button>
      <el-button size="mini" @click="selectDate('prev-month')">先月</el-button>
      <el-button size="mini" @click="selectDate('today')">現在</el-button>
      <el-button size="mini" @click="selectDate('next-month')">来月</el-button>
      <el-button size="mini" @click="selectDate('next-year')">来年</el-button>
    </el-button-group>
  </template>
</el-calendar>

<script>
  export default {
    methods: {
      selectDate(value) {
        this.$refs.calendar.selectDate(value)
      },
    },
  }
</script>
```

:::

### Localization

The default locale of is English, if you need to use other languages, please check [Internationalization](#/jp/component/i18n)

Note, date time locale (month name, first day of the week ...) are also configed in localization.

### 属性

| Attribute             | Description                                                                                                                             | Type               | Accepted Values | Default |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------- | ------- |
| model-value / v-model | バインディング値                                                                                                                        | Date/string/number | —               | —       |
| range                 | 開始時刻と終了時刻を含む時間範囲。開始時間は週の開始日、終了時間は週の終了日でなければならず、時間幅は 2 ヶ月を超えることはできません。 | Array              | —               | —       |
| first-day-of-week     | 週の最初の日                                                                                                                            | Number             | 1 to 7          | 1       |

### デートセルスコープスロット

| Attribute | Description                                                                                                                                                                                                                                 | Type   | Accepted Values | Default |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------- | ------- |
| data      | { type, isSelected, day, date }. `type` は日付が属する月を示し、オプションの値は前月、現在の月、次の月です。`isSelected` は日付が選択されているかどうかを示す。`day`は yyyy-MM-dd 形式でフォーマットされた日付です。`date` はセルが表す日付 | Object | —               | —       |

### メソッド

| Event Name | Description    | Attribute                                               |
| ---------- | -------------- | ------------------------------------------------------- |
| selectDate | 日付の切り替え | today / prev-month / next-month / prev-year / next-year |
