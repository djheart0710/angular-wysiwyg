var app = angular.module('app', ['wysiwyg.module'])

app.controller('MyCtrl', function($scope) {
    $scope.data = {
        text: "hello"
    }
    $scope.menu = [
        ['bold', 'italic', 'underline'],
        ['format-block'],
        ['remove-format'],
        ['ordered-list', 'unordered-list', 'outdent', 'indent'],
        ['left-justify', 'center-justify', 'right-justify'],
        ['code', 'quote', 'paragraph'],
        ['link', 'image']
    ];
})