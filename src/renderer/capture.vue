<template>
    <div id="capture" ref="capture">
        <div
                id="capture-desktop"
                v-if="this.currWin.bgPath"
                :style="{ backgroundImage: 'url(' + this.currWin.bgPath + ')' }"
        ></div>
        <div id="mask" class="mask"></div>
        <canvas
                id="capture-desktop-canvas"
                :style="{
        backgroundImage: 'url(' + this.mosaicPicBase64 + ')',
        background: 'no-repeat',
        backgroundPosition:
          this.selectRect.x + this.currWin.scaleFactor + 'px ' + (this.selectRect.y + this.currWin.scaleFactor) + 'px',
        backgroundSize:
          this.selectRect.width -
          2 * this.currWin.scaleFactor +
          'px ' +
          (this.selectRect.height - 2 * this.currWin.scaleFactor) +
          'px'
      }"
        ></canvas>
        <canvas
                id="assistant-canvas"
                v-if="!this.status.disable"
                :style="{
        position: 'absolute',
        zIndex: 3,
        cursor: !this.status.movable ? 'default' : 'move'
      }"
        ></canvas>
        <div
                id="capture_toolbar"
                class="capture_toolbar"
                :style="{
        top: this.toolbar.top + 'px',
        left: this.toolbar.left + 'px',
        display: this.toolbar.showToolbar ? 'flex' : 'none'
      }"
        >
            <div class="toolbar_item_tool">
                <img
                        class="capture_toolbar_item capture_toolbar_item_rectangle"
                        :src="this.iconSelected.rect ? this.icon.rectangleSelected : this.icon.rectangle"
                        @click="rectangle"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_ellipse"
                        :src="this.iconSelected.ellipse ? this.icon.ellipseSelected : this.icon.ellipse"
                        @click="ellipse"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_arrow"
                        :src="this.iconSelected.arrow ? this.icon.arrowSelected : this.icon.arrow"
                        @click="arrow"
                />
                <img
                        v-if="this.options.curve"
                        class="capture_toolbar_item capture_toolbar_item_pen"
                        :src="this.iconSelected.curve ? this.icon.curveSelected : this.icon.curve"
                        @click="curve"
                />
                <img
                        v-if="this.options.mosaic"
                        class="capture_toolbar_item capture_toolbar_item_mosaic"
                        :src="this.iconSelected.mosaic ? this.icon.mosaicSelected : this.icon.mosaic"
                        @click="mosaic"
                />
                <img
                        v-if="this.options.text"
                        class="capture_toolbar_item capture_toolbar_item_text"
                        :src="this.iconSelected.text ? this.icon.textSelected : this.icon.text"
                        @click="text"
                />
            </div>
            <div class="divider_line"></div>
            <div class="toolbar_item_control">
                <img
                        class="capture_toolbar_item capture_toolbar_item_undo"
                        :src="this.canUndo ? this.icon.undo : this.icon.undoDisable"
                        @click="onUndoItemClick"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_download"
                        :src="this.icon.save"
                        @click="onSaveItemClick"
                />
            </div>
            <div class="toolbar_item_check">
                <img class="capture_toolbar_item capture_toolbar_item_close" :src="this.icon.close" @click="onCloseItemClick" />
                <img class="capture_toolbar_item capture_toolbar_item_check" :src="this.icon.done" @click="onCheckItemClick" />
            </div>
        </div>
        <div
                class="capture_custom_bar_container"
                :style="{
        top: this.customBar.customBarTop + 'px',
        left:
          curShape.type !== 'mosaic' ? this.customBar.customBarLeft + 'px' : this.customBar.customBarLeft + 140 + 'px',
        display: this.customBar.showCustomBar ? 'block' : 'none'
      }"
        >
            <div
                    class="capture_custom_bar_retange"
                    :style="{ marginLeft: this.customBar.customBarRetangeMargin + 'px' }"
            ></div>

            <div class="capture_custom_bar">
                <div class="size_board" v-if="curShape.type !== 'text'">
                    <div class="size_item_min size_item" @click="sizeItemClick($event, 3)"></div>
                    <div
                            class="size_item_middle size_item"
                            :class="{
              size_selected_item: this.customBar.isSizeItemDefauleSelected
            }"
                            @click="sizeItemClick($event, 5)"
                    ></div>
                    <div class="size_item_large size_item" @click="sizeItemClick($event, 7)"></div>
                    <div class="divider_line"></div>
                </div>
                <div class="size_board" v-if="curShape.type === 'text'">
                    <div class="select" @mousedown="setFontSizeOptions(false)" @mouseup="setFontSizeOptions(true)">
                        <div class="font">{{ this.defaultFontSize }}</div>
                        <div class="select_triangle"></div>
                    </div>
                    <div class="divider_line"></div>
                </div>
                <div class="color_board" v-if="curShape.type !== 'mosaic'">
                    <div class="color_item_red color_item" style="background: red" @click="colorItemClick($event, 'red')"></div>
                    <div
                            class="color_item_yellow color_item"
                            style="background: yellow"
                            @click="colorItemClick($event, 'yellow')"
                    ></div>
                    <div
                            class="color_item_green color_item"
                            style="background: green"
                            @click="colorItemClick($event, 'green')"
                    ></div>
                    <div
                            class="color_item_blue color_item"
                            style="background: blue"
                            @click="colorItemClick($event, 'blue')"
                    ></div>
                    <div
                            class="color_item_gray color_item"
                            style="background: gray"
                            @click="colorItemClick($event, 'gray')"
                    ></div>
                    <div
                            class="color_item_white color_item"
                            style="background: white"
                            @click="colorItemClick($event, 'white')"
                    ></div>
                </div>
            </div>
            <div class="select_options" v-if="this.curShape.type === 'text' && this.showFontSizeOptions">
                <div class="select_size_item" v-for="size of 5" @click="onFontSizeClick(28 - 2 * size)">
                    {{ 28 - 2 * size }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import capture from './capture.js'

export default {
  ...capture
}
</script>

<style scoped>
    @import 'capture.css';
</style>
