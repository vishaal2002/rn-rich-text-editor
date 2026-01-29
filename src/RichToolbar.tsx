import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { actions } from './actions';

export function RichToolbar({ editor }: any) {
  return (
    <View style={{ flexDirection: 'row', padding: 8 }}>
      {Object.values(actions).map(action => (
        <TouchableOpacity
          key={action}
          onPress={() => editor?.current?.sendAction(action)}
        >
          <Text style={{ marginHorizontal: 10 }}>{action}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
