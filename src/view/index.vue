<template>
  <div>
    <el-card class="infrastructure-box">
      <div class="infrastructure">
        <div v-for="(item,index) in roomList" :key="index"  class="room animate__animated" :class="'room-'+(index+1)"
             :style="{'background':item.color}">
          <div class="title">{{ item.name }}</div>
          <draggable
            :data-name="item.name"
            :data-type="item.type"
            :list="chosenList[item.name]"
            :group="item.type"
            class="chosen-area"
            @change="chosenListChange($event,item.name)"
            :key="item.name"
          >
            <div :disable-transitions="false"
                 class="people-tag animate__animated"
                 v-for="(people,index) in chosenList[item.name]"
                 :data-name="people.name"
                 :style="{'background':people.peopleColor}"
                 @click="recommendation(people.name)"
                 :key="item.name+'-' + index">
              {{ people.name }}
            </div>
          </draggable>
        </div>
      </div>
    </el-card>
    <div class="people">
      <el-card class="people-card" :key="index" shadow="hover" v-for="(roomType,index) in roomTypeList">
        <div slot="header">
          <span>{{ roomType }}</span>
        </div>
        <draggable
          :list="waitingList[roomType]"
          :group="roomType"
          :key="roomType"
          @end="end"
        >
          <div :disable-transitions="false"
               v-for="people in waitingList[roomType]"
               :data-name="people.name"
               class="people-tag animate__animated"
               :style="{'background':people.peopleColor}"
               @click="activeRoomAndTag(people)"
               :key="people.name+'-' + index">{{ people.name }}
          </div>
        </draggable>
      </el-card>
    </div>
    <el-card class="other">
      <div>这个夕，她开心吗？(心情大于12) ：
        <el-radio-group v-model="other.xiHappyIng">
          <el-radio :label="true">开心</el-radio>
          <el-radio :label="false">不开心</el-radio>
        </el-radio-group>
      </div>
    </el-card>
  </div>
</template>

<script>
import {peoples, roomProperties, rooms} from '../assets/staticData'
import LeaderLine from "leader-line-vue";
import "animate.css"

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
      lines: [],
      // 悬浮标签使用
      allowAnimate: true,
      other: {
        xiHappyIng: true
      }
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.roomTypeList = [...new Set(peoples.map(x => x.type))];
      this.peopleList = this.peopleList.map(people => {
        return {...people, ...this.roomProperties[people.type]}
      })

      // 每个房间 贸易1 贸易2 赤金1 赤金2
      this.roomList = this.roomList.map(room => {
        this.chosenList[room.name] = [];
        let obj = {...room, ...this.roomProperties[room.type]}
        return obj
      })

      // 房间类型 贸易 赤金
      this.roomTypeList.forEach(type => {
        this.waitingList[type] = [...this.peopleList.filter(x => x.type == type)]
      })
    },

    chosenListChange(event, typeName) {
      this.chosenList = {...this.chosenList}
    },
    /**
     * 鼠标拖拽完成计算房间数量
     * @param event
     */
    end(event) {
      if (event.to == event.from) {
        return
      }
      let toData = this.chosenList[event.to.dataset.name];
      let toType = event.to.dataset.type;
      let toName = event.item.innerText.trim();
      if (toData.length > this.roomProperties[toType].max) {
        toData.splice(toData.findIndex(x => x.name == toName), 1);
        this.waitingList[toType].push(this.peopleList.find(x => x.name == toName));
        this.$message({type: 'error', message: '超出最大限制，已删除刚刚添加干员'});
      } else {
        this.chosenList = {...this.chosenList}
        this.$nextTick(() => {
          this.recommendation(toName)
        })
      }
    },
    /**
     * 悬浮添加相关人员数据
     * @param people
     */
    activeRoomAndTag(people) {
      if (!people.friend) {
        return
      }
      if (!this.allowAnimate) {
        return
      }
      this.allowAnimate = false
      let activeDom = []
      // 如果有或者replacementFriend字段 取第一个.
      let friend = people.friend;
      if (people.replacementFriend) {
        friend = [...friend, people.replacementFriend[0]];
      }
      friend.forEach(friendName => {
        activeDom.push(document.querySelector(`.people-tag[data-name='${friendName}']`));
      })
      activeDom.forEach(element => {
        element.classList.add('animate__heartBeat')
        element.addEventListener('animationend', () => {
          element.classList.remove('animate__heartBeat')
          this.allowAnimate = true;
          element.removeEventListener('animationend', () => {})
        });
      })
    },
    /**
     * 建议
     * @param name 干员名称
     */
    recommendation(name) {
      // 清空线条
      this.lines.map(line => {
        line.remove()
      })
      // 该干员所处的位置
      let ele = document.querySelector(`.people-tag[data-name='${name}']`).parentElement;
      // 获取应该和他一起上班的
      let self = this.peopleList.find(x => x.name == name)
      let friend = self.friend;
      // 如果有或者replacementFriend字段 取第一个
      if (self.replacementFriend) {
        friend = [...friend, self.replacementFriend[0]];
      }
      // 特定人物
      if (name == "夕") {
        if (this.other.xiHappyIng) {
          friend = self.happy
        } else {
          friend = self.unhappy
        }
      }
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
            startSocket: 'right',
            color: "#23ade5",
            middleLabel: friendSelf.type,
            size: 2,
          }));
        })
        setTimeout(() => {
          this.lines.map(line => {
            line.position()
          })
        }, 1100)
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
    transition: all 1s;

    .title {
      position: absolute;
      top: 5px;
      left: 5px;
      color: #fff;
      user-select: none;
      text-shadow: 0 0 5px black;
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
  color: #fff;
  text-shadow: 0 0 5px black;
  transition: all 1s;
  display: block;
  padding: 3px 7px;
  text-align: center;
  border-radius: 3px;
}

.other {
  margin-top: 10px;
}
</style>
