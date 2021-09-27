<template>
  <div>
    <el-card class="infrastructure-box">
      <div class="infrastructure">
        <div v-for="(item,index) in roomList" class="room" :class="'room-'+(index+1)">
          <div class="title">{{ item.name }}</div>
          <draggable
            :data-name="item.name"
            :data-type="item.type"
            v-model="chosenList[item.name]"
            :group="item.type"
            class="chosen-area"
            @change="chosenListChange($event,item.name)"
            :key="item.name"
          >
            <el-tag :disable-transitions="false" class="people-tag" v-for="(people,index) in chosenList[item.name]"
                    :data-name="people.name"
                    @click="recommendation(people.name)"
                    :key="item.name+'-' + index">
              {{ people.name }}
            </el-tag>
          </draggable>
        </div>
      </div>
    </el-card>
    <div class="people">
      <el-card class="people-card" shadow="hover" v-for="(roomType,index) in roomTypeList">
        <div slot="header">
          <span>{{ roomType }}</span>
        </div>
        <draggable
          v-model="waitingList[roomType]"
          :group="roomType"
          :key="roomType"
          @end="end"
        >
          <el-tag :disable-transitions="false" v-for="people in waitingList[roomType]" :data-name="people.name"
                  class="people-tag"
                  :key="people.name+'-' + index">
            {{ people.name }}
          </el-tag>
        </draggable>
      </el-card>
    </div>
  </div>
</template>

<script>
import {peoples, roomProperties, rooms} from '../assets/staticData'
import LeaderLine from "leader-line-vue";

export default {
  name: "index",

  data() {
    return {
      roomList: rooms,
      roomProperties: roomProperties,
      peopleList: peoples,
      // 房间类型
      roomTypeList: null,
      // 等待名单
      waitingList: {},
      // 已选名单
      chosenList: {},
      // 线条对象
      lines: []
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.roomTypeList = [...new Set(peoples.map(x => x.type))];
      // 房间类型 贸易 赤金
      this.roomTypeList.forEach(type => {
        this.waitingList[type] = this.peopleList.filter(x => x.type == type)
      })
      // 每个房间 贸易1 贸易2 赤金1 赤金2
      this.roomList.forEach(type => {
        this.chosenList[type.name] = [];
      })
    },
    chosenListChange(event, typeName) {
      this.chosenList = {...this.chosenList}
    },
    end(event) {
      if (event.to == event.from) {
        return
      }
      let toData = this.chosenList[event.to.dataset.name];
      let toType = event.to.dataset.type;
      let toName = event.item.innerText;
      if (toData.length > this.roomProperties[toType].max) {
        toData.splice(toData.find(x => x.name == toName), 1);
        this.waitingList[toType].push(this.peopleList.find(x => x.name == toName));
        this.$message({type: 'error', message: '超出最大限制，已删除刚刚添加干员'});
      }
      this.chosenList = {...this.chosenList}
      this.$nextTick(() => {
        this.recommendation(toName)
      })
    },
    /**
     * 建议
     * @param name 干员名称
     */
    recommendation(name) {
      // 该干员所处的位置
      let ele = document.querySelector(`.people-tag[data-name='${name}']`).parentElement;
      // 获取应该和他一起上班的
      let self = this.peopleList.find(x => x.name == name)
      let friend = self.friend;
      this.lines.map(line => {
        line.remove()
      })
      if (friend) {
        this.lines = [];
        friend.forEach(friendName => {
          // 先看是不是或 或用|隔开  只取一个进行划线
          let friendOr = friendName.split('|');
          if (friendOr.length > 1) {
            friendName = friendOr[0]
          }
          let friendSelf = this.peopleList.find(x => x.name == friendName)
          // 先看同类有没有已经放进去了 有的话就不再添加提示
          if (document.querySelector(`.chosen-area[data-type='${friendSelf.type}'] .people-tag[data-name='${friendSelf.name}']`)) {
            return false;
          }
          // 同类别终点指向自己的位置  其他类别的分别指向对应房间
          let endNode = friendSelf.type == self.type ? ele : document.querySelector(`.chosen-area[data-type='${friendSelf.type}']`)
          this.lines.push(LeaderLine.setLine(document.querySelector(`.people-tag[data-name='${friendName}']`), endNode, {
            dash: {animation: true},
            startSocket: 'top',
            color: "red",
            middleLabel: `请放置于${friendSelf.type}`,
            size: 2,
          }));
        })
        setTimeout(() => {
          this.lines.map(line => {
            line.position()
          })
        }, 350)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.infrastructure-box {
}

.infrastructure {
  display: grid;
  grid-template-columns: repeat(5, 20%);
  grid-template-rows:100px repeat(4, 80px);

  .room {
    background: #23ade5;
    border: 1px solid #fff;
    text-align: center;
    position: relative;


    .title {
      position: absolute;
      top: 5px;
      left: 5px;
      color: #fff;
      user-select: none;
    }

    .chosen-area {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      flex-wrap: wrap;

      .people-tag {
        margin-bottom: 10px;
      }
    }
  }

  .room-1 {
    grid-column-start: 3;
    grid-column-start: 4;
  }

  .room-18 {
    grid-column-start: 3;
    grid-column-start: 4;
  }
}

.people {
  display: flex;
  flex-wrap: wrap;

  .el-card {
    margin: 10px 10px 0 0;

    .el-card__header {
      padding: 10px 20px;
    }
  }
}

.people-tag {
  user-select: none;
  margin: 2px;
}
</style>
