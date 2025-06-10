package com.movemaster.backend.controller;

import com.movemaster.backend.entity.Move;
import com.movemaster.backend.repository.MoveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moves")
public class MoveController {
    @Autowired
    private MoveRepository moveRepository;

    @GetMapping
    public List<Move> getAllMoves() {
        return moveRepository.findAll();
    }

    @PostMapping
    public Move createMove(@RequestBody Move move) {
        return moveRepository.save(move);
    }
}
