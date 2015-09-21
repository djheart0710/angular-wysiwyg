/*
Usage: <wysiwyg textarea-id="question" textarea-class="form-control"  textarea-height="80px" textarea-name="textareaQuestion" textarea-required ng-model="question.question" enable-bootstrap-title="true"></wysiwyg>
    options
        textarea-id             The id to assign to the editable div
        textarea-class          The class(es) to assign to the the editable div
        textarea-height         If not specified in a text-area class then the hight of the editable div (default: 80px)
        textarea-name           The name attribute of the editable div 
        textarea-required       HTML/AngularJS required validation
        textarea-menu           Array of Arrays that contain the groups of buttons to show Defualt:Show all button groups
        ng-model                The angular data model
        enable-bootstrap-title  True/False whether or not to show the button hover title styled with bootstrap  

Requires: 
    Twitter-bootstrap, fontawesome, jquery, angularjs, bootstrap-color-picker (https://github.com/buberdds/angular-bootstrap-colorpicker)

*/
/*
    TODO: 
        tab support
        custom button fuctions

        limit use of scope
        use compile fuction instead of $compile
        move button elements to js objects and use doc fragments 
*/
(function (angular, undefined) {
  'use strict';
  var DEFAULT_MENU = [
      [
        'bold',
        'italic',
        'underline'
      ],
      ['format-block'],
      ['remove-format'],
      [
        'ordered-list',
        'unordered-list',
        'outdent',
        'indent'
      ],
      [
        'left-justify',
        'center-justify',
        'right-justify'
      ],
      [
        'code',
        'quote',
        'paragraph'
      ],
      [
        'link',
        'image'
      ]
    ];
  angular.module('wysiwyg.module', []).directive('wysiwyg', [
    '$timeout',
    'wysiwgGui',
    '$compile',
    function ($timeout, wysiwgGui, $compile) {
      return {
        template: '<div>' + '<style>' + '   .wysiwyg-textarea[contentEditable="false"] { background-color:#eee}' + '   .wysiwyg-btn-group-margin { margin-right:5px; }' + '   .wysiwyg-select { height:30px;margin-bottom:1px;}' + '   .wysiwyg-colorpicker { font-family: arial, sans-serif !important;font-size:16px !important; padding:2px 10px !important;}' + '</style>' + '<div class="wysiwyg-menu"></div>' + '<div id="{{textareaId}}" ng-attr-style="resize:vertical;height:{{textareaHeight || \'80px\'}}; overflow:auto" contentEditable="{{!disabled}}" class="{{textareaClass}} wysiwyg-textarea" rows="{{textareaRows}}" name="{{textareaName}}" required="{{textareaRequired}}" placeholder="{{textareaPlaceholder}}" ng-model="value"></div>' + '</div>',
        restrict: 'E',
        scope: {
          value: '=ngModel',
          textareaHeight: '@textareaHeight',
          textareaName: '@textareaName',
          textareaClass: '@textareaClass',
          textareaRequired: '@textareaRequired',
          textareaId: '@textareaId',
          textareaMenu: '=textareaMenu',
          textareaCustomMenu: '=textareaCustomMenu',
          fn: '&',
          disabled: '=?disabled'
        },
        replace: true,
        require: 'ngModel',
        link: link,
        transclude: true
      };
      function link(scope, element, attrs, ngModelController) {
        var textarea = element.find('div.wysiwyg-textarea');
        scope.isLink = false;
        scope.formatBlocks = [
          {
            name: 'Heading Blocks',
            value: 'div'
          },
          {
            name: '\u6807\u98981',
            value: 'h1'
          },
          {
            name: '\u6807\u98982',
            value: 'h2'
          },
          {
            name: '\u6807\u98983',
            value: 'h3'
          },
          {
            name: '\u6807\u98984',
            value: 'h4'
          },
          {
            name: '\u6807\u98985',
            value: 'h5'
          },
          {
            name: '\u6807\u98986',
            value: 'h6'
          }
        ];
        scope.formatBlock = scope.formatBlocks[0];
        if (angular.isArray(scope.cssClasses)) {
          scope.cssClasses.unshift('css');
          scope.cssClass = scope.cssClasses[0];
        }
        init();
        function init() {
          compileMenu();
          configureDisabledWatch();
          configureBootstrapTitle();
          configureListeners();
        }
        function compileMenu() {
          wysiwgGui.setCustomElements(scope.textareaCustomMenu);
          var menuDiv = element.children('div.wysiwyg-menu')[0];
          menuDiv.appendChild(wysiwgGui.createMenu(scope.textareaMenu));
          $compile(menuDiv)(scope);
        }
        function configureDisabledWatch() {
          scope.$watch('disabled', function (newValue) {
            angular.element('div.wysiwyg-menu').find('button').each(function () {
              angular.element(this).attr('disabled', newValue);
            });
            angular.element('div.wysiwyg-menu').find('select').each(function () {
              angular.element(this).attr('disabled', newValue);
            });
          });
        }
        function configureBootstrapTitle() {
          if (attrs.enableBootstrapTitle === 'true' && attrs.enableBootstrapTitle !== undefined) {
            element.find('button[title]').tooltip({ container: 'body' });
          }
        }
        function insertTab(html, position) {
          var begining = html.substr(0, position);
          var end = html.substr(position);
          return begining + '<span style="white-space:pre">    </span>' + end;
        }
        function configureListeners() {
          //Send message to calling controller that a button has been clicked.
          angular.element('.wysiwyg-menu').find('button').on('click', function () {
            var title = angular.element(this);
            scope.$emit('wysiwyg.click', title.attr('title') || title.attr('data-original-title'));
          });
          textarea.on('input keyup paste mouseup', function () {
            var html = textarea.html();
            if (html == '<br>') {
              html = '';
            }
            ngModelController.$setViewValue(html);
          });
          textarea.on('keydown', function (event) {
            if (event.keyCode == 9) {
              var TAB_SPACES = 4;
              var html = textarea.html();
              var selection = window.getSelection();
              var position = selection.anchorOffset;
              event.preventDefault();  // html = insertTab(html, position);
                                       // textarea.html(html);
                                       // selection.collapse(textarea[0].firstChild, position + TAB_SPACES);    
            }
          });
          textarea.on('click keyup focus mouseup', function () {
            $timeout(function () {
              scope.isBold = scope.cmdState('bold');
              scope.isUnderlined = scope.cmdState('underline');
              scope.isItalic = scope.cmdState('italic');
              scope.isRightJustified = scope.cmdState('justifyright');
              scope.isLeftJustified = scope.cmdState('justifyleft');
              scope.isCenterJustified = scope.cmdState('justifycenter');
              scope.isPre = scope.cmdValue('formatblock') === 'pre';
              scope.isBlockquote = scope.cmdValue('formatblock') === 'blockquote';
              scope.isOrderedList = scope.cmdState('insertorderedlist');
              scope.isUnorderedList = scope.cmdState('insertunorderedlist');
              // scope.fonts.forEach(function(v, k) { //works but kinda crappy.
              //     if (scope.cmdValue('fontname').indexOf(v) > -1) {
              //         scope.font = v;
              //         return false;
              //     }
              // });
              scope.cmdValue('formatblock').toLowerCase();
              scope.formatBlocks.forEach(function (v, k) {
                if (scope.cmdValue('formatblock').toLowerCase() === v.value.toLowerCase()) {
                  scope.formatBlock = v;
                  return false;
                }
              });
              scope.isLink = itemIs('A');
            }, 0);
          });
        }
        //Used to detect things like A tags and others that dont work with cmdValue().
        function itemIs(tag) {
          var selection = window.getSelection().getRangeAt(0);
          if (selection) {
            if (selection.startContainer.parentNode.tagName === tag.toUpperCase() || selection.endContainer.parentNode.tagName === tag.toUpperCase()) {
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
        // model -> view
        ngModelController.$render = function () {
          textarea.html(ngModelController.$viewValue);
        };
        scope.format = function (cmd, arg) {
          document.execCommand(cmd, false, arg);
        };
        scope.cmdState = function (cmd) {
          return document.queryCommandState(cmd);
        };
        scope.cmdValue = function (cmd) {
          return document.queryCommandValue(cmd);
        };
        scope.createLink = function () {
          var input = prompt('Enter the link URL');
          if (input && input !== undefined)
            scope.format('createlink', input);
        };
        scope.insertImage = function () {
          var input = prompt('Enter the image URL');
          if (input && input !== undefined)
            scope.format('insertimage', input);
        };
        scope.setFormatBlock = function () {
          scope.format('formatBlock', scope.formatBlock.value);
        };
        scope.format('enableobjectresizing', true);
        scope.format('styleWithCSS', true);
      }
    }
  ]).factory('wysiwgGui', [
    'wysiwgGuiElements',
    function (wysiwgGuiElements) {
      var ELEMENTS = wysiwgGuiElements;
      var custom = {};
      var setCustomElements = function (el) {
        custom = el;
      };
      var getMenuGroup = function () {
        return {
          tag: 'div',
          classes: 'btn-group btn-group-sm wysiwyg-btn-group-margin'
        };
      };
      var getMenuItem = function (item) {
        return ELEMENTS[item] || {};
      };
      var createMenu = function (menu) {
        angular.extend(ELEMENTS, custom);
        //Get the default menu or the passed in menu
        if (angular.isDefined(menu) && menu !== '') {
          menu = menu;  //stringToArray(menu)
        } else {
          menu = DEFAULT_MENU;
        }
        //create div to add everything to.
        var startDiv = document.createElement('div');
        var el;
        for (var i = 0; i < menu.length; i++) {
          var menuGroup = create(getMenuGroup());
          for (var j = 0; j < menu[i].length; j++) {
            //link has two functions link and unlink
            if (menu[i][j] === 'link') {
              el = create(getMenuItem('unlink'));
              menuGroup.appendChild(el);
            }
            el = create(getMenuItem(menu[i][j]));
            menuGroup.appendChild(el);
          }
          startDiv.appendChild(menuGroup);
        }
        return startDiv;
      };
      function create(obj) {
        var el;
        if (obj.tag) {
          el = document.createElement(obj.tag);
        } else if (obj.text) {
          el = document.createElement('span');
        } else {
          console.log('cannot create this element.');
          el = document.createElement('span');
          return el;
        }
        if (obj.text && document.all) {
          el.innerText = obj.text;
        } else if (obj.text) {
          el.textContent = obj.text;
        }
        if (obj.classes) {
          el.className = obj.classes;
        }
        if (obj.html) {
          el.innerHTML = obj.html;
        }
        if (obj.attributes && obj.attributes.length) {
          for (var i in obj.attributes) {
            var attr = obj.attributes[i];
            if (attr.name && attr.value) {
              el.setAttribute(attr.name, attr.value);
            }
          }
        }
        if (obj.data && obj.data.length) {
          for (var item in obj.data) {
            el.appendChild(create(obj.data[item]));
          }
        }
        return el;
      }
      return {
        createMenu: createMenu,
        setCustomElements: setCustomElements
      };
    }
  ]).value('wysiwgGuiElements', {
    'bold': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u7c97\u4f53'
        },
        {
          name: 'ng-click',
          value: 'format(\'bold\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isBold }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-bold'
        }]
    },
    'italic': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u659c\u4f53'
        },
        {
          name: 'ng-click',
          value: 'format(\'italic\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isItalic }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-italic'
        }]
    },
    'underline': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u4e0b\u5212\u7ebf'
        },
        {
          name: 'ng-click',
          value: 'format(\'underline\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isUnderlined }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-underline'
        }]
    },
    'remove-format': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u79fb\u9664\u683c\u5f0f'
        },
        {
          name: 'ng-click',
          value: 'format(\'removeFormat\')'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-eraser'
        }]
    },
    'ordered-list': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u7f16\u53f7\u5217\u8868'
        },
        {
          name: 'ng-click',
          value: 'format(\'insertorderedlist\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isOrderedList }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-list-ol'
        }]
    },
    'unordered-list': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u65e0\u5e8f\u5217\u8868'
        },
        {
          name: 'ng-click',
          value: 'format(\'insertunorderedlist\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isUnorderedList }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-list-ul'
        }]
    },
    'outdent': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u51cf\u5c11\u7f29\u8fdb'
        },
        {
          name: 'ng-click',
          value: 'format(\'outdent\')'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-outdent'
        }]
    },
    'indent': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u589e\u52a0\u7f29\u8fdb'
        },
        {
          name: 'ng-click',
          value: 'format(\'indent\')'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-indent'
        }]
    },
    'left-justify': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u5de6\u5bf9\u9f50'
        },
        {
          name: 'ng-click',
          value: 'format(\'justifyleft\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isLeftJustified }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-align-left'
        }]
    },
    'center-justify': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u5c45\u4e2d'
        },
        {
          name: 'ng-click',
          value: 'format(\'justifycenter\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isCenterJustified }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-align-center'
        }]
    },
    'right-justify': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u53f3\u5bf9\u9f50'
        },
        {
          name: 'ng-click',
          value: 'format(\'justifyright\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isRightJustified }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-align-right'
        }]
    },
    'quote': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u5f15\u7528'
        },
        {
          name: 'ng-click',
          value: 'format(\'formatblock\', \'blockquote\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isBlockquote }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-quote-right'
        }]
    },
    'paragraph': {
      tag: 'button',
      classes: 'btn btn-default',
      text: 'P',
      attributes: [
        {
          name: 'title',
          value: '\u6bb5\u843d'
        },
        {
          name: 'ng-click',
          value: 'format(\'insertParagraph\')'
        },
        {
          name: 'ng-class',
          value: '{ active: isParagraph }'
        },
        {
          name: 'type',
          value: 'button'
        }
      ]
    },
    'image': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u63d2\u5165\u56fe\u7247'
        },
        {
          name: 'ng-click',
          value: 'insertImage()'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-picture-o'
        }]
    },
    'format-block': {
      tag: 'select',
      classes: 'form-control wysiwyg-select',
      attributes: [
        {
          name: 'title',
          value: '\u683c\u5f0f'
        },
        {
          name: 'ng-model',
          value: 'formatBlock'
        },
        {
          name: 'ng-options',
          value: 'f.name for f in formatBlocks'
        },
        {
          name: 'ng-change',
          value: 'setFormatBlock()'
        }
      ]
    },
    'link': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u63d2\u5165\u94fe\u63a5'
        },
        {
          name: 'ng-click',
          value: 'createLink()'
        },
        {
          name: 'ng-show',
          value: '!isLink'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-link'
        }]
    },
    'unlink': {
      tag: 'button',
      classes: 'btn btn-default',
      attributes: [
        {
          name: 'title',
          value: '\u53d6\u6d88\u94fe\u63a5'
        },
        {
          name: 'ng-click',
          value: 'format(\'unlink\')'
        },
        {
          name: 'ng-show',
          value: 'isLink'
        },
        {
          name: 'type',
          value: 'button'
        }
      ],
      data: [{
          tag: 'i',
          classes: 'fa fa-unlink'
        }]
    }
  });
}(angular));