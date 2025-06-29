package main

import (
	"testing"
)

func TestMain(t *testing.T) {
	t.Log("Main test suite")
}

func TestBasicFunctionality(t *testing.T) {
	// 基本的なテスト
	if 1+1 != 2 {
		t.Error("Basic math failed")
	}
}
