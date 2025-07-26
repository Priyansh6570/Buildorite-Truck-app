import React, { useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";

const ReusableBottomSheet = forwardRef(({
  initialIndex = -1,
  enablePanDownToClose = true,
  enableDynamicSizing = true,
  backgroundStyle = { backgroundColor: '#fff' },
  handleIndicatorStyle = { backgroundColor: '#888' },
  scrollable = false,
  contentContainerStyle = {},
  children,
  onChange,
  onClose,
  onOpen,
  enableBackdrop = true,
  ...otherProps
}, ref) => {
  const bottomSheetRef = useRef(null);
  
  const handleSheetChanges = useCallback((index) => {
   
    if (onChange) {
      onChange(index);
    }
   
    if (index === -1 && onClose) {
      onClose();
    }
   
    if (index >= 0 && onOpen) {
      onOpen(index);
    }
  }, [onChange, onClose, onOpen]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        enableTouchThrough={false}
        onPress={() => {
          bottomSheetRef.current?.close();
        }}
      />
    ),
    []
  );

  useImperativeHandle(ref, () => ({
    snapToIndex: (index) => {
      bottomSheetRef.current?.snapToIndex(index);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
    expand: () => {
      bottomSheetRef.current?.expand();
    },
    collapse: () => {
      bottomSheetRef.current?.collapse();
    },
    snapToPosition: (position) => {
      bottomSheetRef.current?.snapToPosition(position);
    },
  }), []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={initialIndex}
      shadowElevation={5}
      enablePanDownToClose={enablePanDownToClose}
      enableDynamicSizing={enableDynamicSizing}
      onChange={handleSheetChanges}
      backdropComponent={enableBackdrop ? renderBackdrop : null}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      animateOnMount={true}
      animationConfigs={{
        duration: 250,
      }}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      {...otherProps}
    >
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={[styles.scrollContentContainer, contentContainerStyle]}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </BottomSheetView>
      )}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

ReusableBottomSheet.displayName = 'ReusableBottomSheet';
export default ReusableBottomSheet;